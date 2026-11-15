// Remplit la base avec le contenu de démonstration : npm run seed
// ATTENTION : efface les données existantes.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Chapter, Exercise, Progress, Solution, Comment, Work, Annale, Attempt } from './models.js';
import { chapitres, exercices, annales } from './seedData.js';

export async function seed() {
  await Promise.all([User, Chapter, Exercise, Progress, Solution, Comment, Work, Annale, Attempt].map((M) => M.deleteMany({})));

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const [eleve, prof, lova, theo] = await User.create([
    { nom: 'Chriskely', email: 'eleve@demo.mg', passwordHash, objectifs: [{ texte: 'Réviser les probabilités' }, { texte: 'Faire un examen blanc' }] },
    { nom: 'Prof. Martin', email: 'prof@demo.mg', passwordHash, role: 'enseignant' },
    { nom: 'Lova', email: 'lova@demo.mg', passwordHash, profilPublic: true },
    { nom: 'Théo', email: 'theo@demo.mg', passwordHash },
  ]);

  const chaps = await Chapter.create(chapitres);
  const parTitre = Object.fromEntries(chaps.map((c) => [c.titre, c]));
  const compteur = {};
  const exos = await Exercise.create(
    exercices.map(([titre, e]) => ({ ...e, chapter: parTitre[titre]._id, numero: (compteur[titre] = (compteur[titre] || 0) + 1), auteur: prof._id }))
  );
  await Annale.create(annales);

  const recurrente = exos.find((e) => e.titre === 'Une suite récurrente');
  await Solution.create({
    exercise: recurrente._id,
    auteur: lova._id,
    validee: true,
    valideePar: prof._id,
    utile: [theo._id, eleve._id],
    contenu: String.raw`On pose $v_n = u_n + 1$. Alors
\[ v_{n+1} = u_{n+1} + 1 = 2u_n + 1 + 1 = 2(u_n + 1) = 2v_n, \]
donc $(v_n)$ est géométrique de raison 2 et $v_0 = u_0 + 1 = 2$. Ainsi
\[ v_n = 2^n v_0 = 2^{n+1}, \quad\text{d'où}\quad u_n = v_n - 1 = 2^{n+1} - 1. \]`,
  });
  await Comment.create([
    { exercise: recurrente._id, auteur: theo._id, texte: String.raw`Pourquoi introduit-on $v_n = u_n + 1$ plutôt que de travailler directement sur $(u_n)$ ?` },
    { exercise: recurrente._id, auteur: prof._id, texte: String.raw`Le changement de variable élimine le terme constant : on obtient une suite géométrique ($v_{n+1} = 2v_n$), beaucoup plus simple à étudier.` },
  ]);

  // Un peu de progression pour le compte de démonstration.
  const faits = exos.filter((e) => ['Somme de termes consécutifs', 'Une suite récurrente', "Étude d'une fonction"].includes(e.titre));
  await Progress.create(faits.map((e) => ({ user: eleve._id, exercise: e._id, chapter: e.chapter })));

  return { chapitres: chaps.length, exercices: exos.length, annales: annales.length };
}

// Exécution directe : node src/seed.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grand-et-disciples');
  const n = await seed();
  console.log(`Base initialisée : ${n.chapitres} chapitres, ${n.exercices} exercices, ${n.annales} sujets.`);
  console.log('Comptes de démonstration (mot de passe : demo1234) : eleve@demo.mg, prof@demo.mg');
  await mongoose.disconnect();
}
