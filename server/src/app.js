import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

import auth from './routes/auth.js';
import content from './routes/content.js';
import community from './routes/community.js';
import works from './routes/works.js';
import annales from './routes/annales.js';
import me from './routes/me.js';
import { aiEnabled } from './gemini.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression()); // réponses gzip : moins de données consommées
  const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, ia: aiEnabled() }));
  app.use('/api', auth, content, community, works, annales, me);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route introuvable.' }));

  // En production, le serveur distribue aussi le client compilé (client/dist).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(
      express.static(dist, {
        setHeaders: (res, file) => {
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          else res.setHeader('Cache-Control', 'no-cache');
        },
      })
    );
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.name === 'CastError') [status, message] = [404, 'Ressource introuvable.'];
    else if (err.name === 'ValidationError') status = 400;
    else if (err.type === 'entity.parse.failed') [status, message] = [400, 'Requête invalide.'];
    else if (err.type === 'entity.too.large') [status, message] = [413, 'Fichier trop lourd.'];
    else if (err.code === 11000) [status, message] = [409, 'Cet élément existe déjà.'];
    if (status >= 500) {
      console.error(err);
      message = 'Erreur interne du serveur.';
    }
    res.status(status).json({ error: message });
  });

  return app;
}
