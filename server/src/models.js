import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });

const userSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['eleve', 'enseignant', 'admin'], default: 'eleve' },
    classe: { type: String, default: 'Terminale' },
    serie: { type: String, default: 'C' },
    profilPublic: { type: Boolean, default: false },
    objectifHebdo: { type: Number, default: 6, min: 1, max: 7 },
    objectifs: [{ texte: { type: String, maxlength: 120 }, fait: { type: Boolean, default: false } }],
    joursPratique: [String], // dates AAAA-MM-JJ
  },
  { timestamps: true }
);

const chapterSchema = new Schema({
  matiere: { type: String, required: true, index: true },
  titre: { type: String, required: true },
  ordre: { type: Number, default: 1 },
  classe: { type: String, default: 'Terminale' },
  resume: String,
  contenu: String, // texte + LaTeX
});

const exerciseSchema = new Schema(
  {
    chapter: ref('Chapter', { required: true, index: true }),
    numero: { type: Number, default: 1 },
    titre: { type: String, required: true, maxlength: 140 },
    niveau: { type: String, enum: ['Facile', 'Intermédiaire', 'Difficile'], default: 'Intermédiaire' },
    duree: { type: Number, default: 15 }, // minutes
    enonce: { type: String, required: true },
    indice: String,
    correction: String,
    auteur: ref('User'),
  },
  { timestamps: true }
);

const progressSchema = new Schema(
  { user: ref('User', { required: true }), exercise: ref('Exercise', { required: true }), chapter: ref('Chapter') },
  { timestamps: true }
);
progressSchema.index({ user: 1, exercise: 1 }, { unique: true });

const solutionSchema = new Schema(
  {
    exercise: ref('Exercise', { required: true, index: true }),
    auteur: ref('User', { required: true }),
    contenu: { type: String, required: true, maxlength: 20000 },
    utile: [ref('User')],
    validee: { type: Boolean, default: false },
    valideePar: ref('User'),
  },
  { timestamps: true }
);

const commentSchema = new Schema(
  {
    exercise: ref('Exercise', { index: true }),
    work: ref('Work', { index: true }),
    auteur: ref('User', { required: true }),
    texte: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: true }
);

const workSchema = new Schema(
  {
    auteur: ref('User', { required: true, index: true }),
    titre: { type: String, default: 'Nouveau travail', maxlength: 140 },
    format: { type: String, enum: ['texte', 'latex'], default: 'texte' },
    enonce: { type: String, default: '', maxlength: 10000 },
    contenu: { type: String, default: '', maxlength: 60000 },
    exercise: ref('Exercise'),
    publie: { type: Boolean, default: false },
    feedback: {
      verdict: String,
      resume: String,
      etapes: [{ titre: String, statut: String, commentaire: String, extrait: String, correction: String }],
      genereLe: Date,
    },
  },
  { timestamps: true }
);

const annaleSchema = new Schema({
  matiere: { type: String, required: true },
  serie: { type: String, required: true },
  annee: Number,
  titre: { type: String, required: true },
  type: { type: String, default: "Sujet d'entraînement" },
  dureeMin: { type: Number, default: 180 },
  exercices: [{ titre: String, theme: String, points: Number, enonce: String, corrige: String }],
});

const attemptSchema = new Schema(
  {
    user: ref('User', { required: true, index: true }),
    annale: ref('Annale', { required: true }),
    debut: { type: Date, default: Date.now },
    fin: Date,
    reponses: [{ index: Number, texte: { type: String, maxlength: 20000 } }],
    estimation: { type: String, enum: ['ia', 'auto', 'attente'], default: 'attente' },
    note: Number, // sur 20
    detail: [{ index: Number, theme: String, points: Number, sur: Number, commentaire: String }],
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
export const Chapter = model('Chapter', chapterSchema);
export const Exercise = model('Exercise', exerciseSchema);
export const Progress = model('Progress', progressSchema);
export const Solution = model('Solution', solutionSchema);
export const Comment = model('Comment', commentSchema);
export const Work = model('Work', workSchema);
export const Annale = model('Annale', annaleSchema);
export const Attempt = model('Attempt', attemptSchema);
