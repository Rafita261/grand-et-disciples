import { Router } from 'express';
import { Work, Exercise, Solution } from '../models.js';
import { ah, httpError, str, requireAuth, aiLimiter, touchPractice } from '../util.js';
import { aiEnabled, analyserSolution, transcrire, versLatex } from '../gemini.js';

const r = Router();
r.use(requireAuth);

const mine = async (req) => {
  const w = await Work.findOne({ _id: req.params.id, auteur: req.user._id });
  if (!w) throw httpError(404, 'Travail introuvable.');
  return w;
};

r.get(
  '/works',
  ah(async (req, res) => {
    res.json(
      await Work.find({ auteur: req.user._id }, 'titre format publie exercise updatedAt feedback.verdict')
        .sort({ updatedAt: -1 })
        .limit(100)
        .lean()
    );
  })
);

r.post(
  '/works',
  ah(async (req, res) => {
    const doc = { auteur: req.user._id, titre: str(req.body.titre, 140) || 'Nouveau travail' };
    if (req.body.exercise) {
      const e = await Exercise.findById(str(req.body.exercise, 40), 'titre enonce').lean();
      if (e) Object.assign(doc, { exercise: e._id, titre: e.titre, enonce: e.enonce });
    }
    const w = await Work.create(doc);
    res.status(201).json(w);
  })
);

r.get('/works/:id', ah(async (req, res) => res.json(await mine(req))));

r.put(
  '/works/:id',
  ah(async (req, res) => {
    const w = await mine(req);
    const b = req.body;
    if (typeof b.titre === 'string') w.titre = str(b.titre, 140) || 'Sans titre';
    if (['texte', 'latex'].includes(b.format)) w.format = b.format;
    if (typeof b.enonce === 'string') w.enonce = b.enonce.slice(0, 10000);
    if (typeof b.contenu === 'string') w.contenu = b.contenu.slice(0, 60000);
    await w.save();
    await touchPractice(req.user._id);
    res.json({ ok: true, updatedAt: w.updatedAt });
  })
);

r.delete(
  '/works/:id',
  ah(async (req, res) => {
    await (await mine(req)).deleteOne();
    res.status(204).end();
  })
);

r.post(
  '/works/:id/analyser',
  aiLimiter,
  ah(async (req, res) => {
    const w = await mine(req);
    if (w.contenu.trim().length < 10) throw httpError(400, "Rédige d'abord ta solution.");
    w.feedback = await analyserSolution({ enonce: w.enonce, contenu: w.contenu, format: w.format });
    await w.save();
    res.json(w.feedback);
  })
);

// Publier : devient une solution si le travail répond à un exercice, sinon un travail partagé.
r.post(
  '/works/:id/publier',
  ah(async (req, res) => {
    const w = await mine(req);
    if (w.contenu.trim().length < 10) throw httpError(400, 'Rien à publier pour le moment.');
    if (w.exercise) {
      const s = await Solution.create({ exercise: w.exercise, auteur: req.user._id, contenu: w.contenu.slice(0, 20000) });
      return res.json({ exercise: w.exercise, solution: s._id });
    }
    w.publie = true;
    await w.save();
    res.json({ work: w._id });
  })
);

r.get('/ai/status', (_req, res) => res.json({ enabled: aiEnabled() }));

r.post(
  '/ai/transcrire',
  aiLimiter,
  ah(async (req, res) => {
    const mimeType = str(req.body.mimeType, 40);
    const data = typeof req.body.data === 'string' ? req.body.data : '';
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(mimeType)) throw httpError(400, 'Format accepté : photo (JPEG, PNG, WebP) ou PDF.');
    if (!data || data.length > 5_500_000 || !/^[A-Za-z0-9+/=]+$/.test(data)) throw httpError(400, 'Fichier invalide ou trop lourd (4 Mo maximum).');
    const texte = await transcrire({ mimeType, data, format: req.body.format === 'latex' ? 'latex' : 'texte' });
    res.json({ texte });
  })
);

r.post(
  '/ai/latex',
  aiLimiter,
  ah(async (req, res) => {
    const texte = str(req.body.texte, 30000);
    if (texte.length < 3) throw httpError(400, 'Texte vide.');
    res.json({ texte: await versLatex(texte) });
  })
);

export default r;
