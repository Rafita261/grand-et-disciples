import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { aiEnabled, cles } from './gemini.js';

const { PORT = 4000, MONGODB_URI = 'mongodb://127.0.0.1:27017/grand-et-disciples', NODE_ENV, JWT_SECRET } = process.env;

if (NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'change-moi-en-production')) {
  console.error('JWT_SECRET doit être défini avec une valeur secrète en production.');
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI);
} catch (e) {
  console.error('Connexion à MongoDB impossible :', e.message);
  process.exit(1);
}

createApp().listen(PORT, () => {
  console.log(`Entraide — API sur http://localhost:${PORT}`);
  console.log(aiEnabled() ? `Correction IA : activée (${cles().length} clé(s) Gemini).` : 'Correction IA : désactivée (GEMINI_API_KEYS vide).');
});
