import { Router } from 'express';
import { Chapter, Exercise, Progress, Solution } from '../models.js';
import { ah, httpError, str, escapeRegex, requireAuth, requireTeacher, touchPractice } from '../util.js';

const r = Router();
r.use(requireAuth);

// Un exercice « proposé » par un élève reste invisible tant qu'un enseignant ne l'a pas publié.
export const PUBLIE = { statut: { $ne: 'propose' } };
const estEnseignant = (u) => u.role !== 'eleve';

/** Chapitres enrichis de la progression de l'élève. */
export async function chaptersWithProgress(userId, filter = {}) {
  const [chapters, exos, prog] = await Promise.all([
    Chapter.find(filter, '-contenu').sort({ matiere: 1, ordre: 1 }).lean(),
    Exercise.find(PUBLIE, 'chapter').lean(),
    Progress.find({ user: userId }, 'exercise chapter updatedAt').sort({ updatedAt: -1 }).lean(),
  ]);
  const total = {};
  const done = {};
  exos.forEach((e) => (total[e.chapter] = (total[e.chapter] || 0) + 1));
  prog.forEach((p) => (done[p.chapter] = (done[p.chapter] || 0) + 1));
  return {
    chapters: chapters.map((c) => {
      const t = total[c._id] || 0;
      const d = Math.min(done[c._id] || 0, t);
      return { ...c, total: t, resolus: d, pct: t ? Math.round((d / t) * 100) : 0 };
    }),
    dernier: prog[0]?.chapter ? String(prog[0].chapter) : null,
  };
}

/* ---------- Chapitres ---------- */

r.get(
  '/chapters',
  ah(async (req, res) => {
    const filter = req.query.matiere ? { matiere: str(req.query.matiere, 60) } : {};
    res.json((await chaptersWithProgress(req.user._id, filter)).chapters);
  })
);

const champsChapitre = (b) => ({
  matiere: str(b.matiere, 60),
  titre: str(b.titre, 140),
  classe: str(b.classe, 30) || 'Terminale',
  resume: str(b.resume, 300),
  contenu: typeof b.contenu === 'string' ? b.contenu.slice(0, 60000) : '',
});

r.post(
  '/chapters',
  requireTeacher,
  ah(async (req, res) => {
    const doc = champsChapitre(req.body);
    if (!doc.matiere || !doc.titre) throw httpError(400, 'Matière et titre sont obligatoires.');
    doc.ordre = (await Chapter.countDocuments({ matiere: doc.matiere })) + 1;
    const c = await Chapter.create(doc);
    res.status(201).json({ _id: c._id });
  })
);

r.put(
  '/chapters/:id',
  requireTeacher,
  ah(async (req, res) => {
    const doc = champsChapitre(req.body);
    if (!doc.matiere || !doc.titre) throw httpError(400, 'Matière et titre sont obligatoires.');
    const ordre = parseInt(req.body.ordre, 10);
    if (ordre > 0) doc.ordre = ordre;
    const c = await Chapter.findByIdAndUpdate(req.params.id, doc, { new: true });
    if (!c) throw httpError(404, 'Chapitre introuvable.');
    res.json({ _id: c._id });
  })
);

r.delete(
  '/chapters/:id',
  requireTeacher,
  ah(async (req, res) => {
    if (await Exercise.exists({ chapter: req.params.id }))
      throw httpError(409, 'Ce chapitre contient des exercices : supprime-les ou déplace-les d’abord.');
    await Chapter.deleteOne({ _id: req.params.id });
    res.status(204).end();
  })
);

r.get(
  '/chapters/:id',
  ah(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).lean();
    if (!chapter) throw httpError(404, 'Chapitre introuvable.');
    const [exercices, prog] = await Promise.all([
      Exercise.find({ chapter: chapter._id, ...PUBLIE }, 'numero titre niveau duree').sort({ numero: 1 }).lean(),
      Progress.find({ user: req.user._id, chapter: chapter._id }, 'exercise').lean(),
    ]);
    const done = new Set(prog.map((p) => String(p.exercise)));
    res.json({ ...chapter, exercices: exercices.map((e) => ({ ...e, resolu: done.has(String(e._id)) })) });
  })
);

/* ---------- Exercices ---------- */

r.get(
  '/exercises',
  ah(async (req, res) => {
    // ?propositions=1 : file d'attente (toutes pour un enseignant, les siennes pour un élève).
    const filter =
      req.query.propositions === '1'
        ? { statut: 'propose', ...(estEnseignant(req.user) ? {} : { auteur: req.user._id }) }
        : { ...PUBLIE };
    if (req.query.chapter) filter.chapter = str(req.query.chapter, 40);
    if (req.query.niveau) filter.niveau = str(req.query.niveau, 20);
    if (req.query.q) filter.titre = new RegExp(escapeRegex(str(req.query.q, 60)), 'i');
    if (req.query.matiere && !filter.chapter) {
      filter.chapter = { $in: await Chapter.find({ matiere: str(req.query.matiere, 60) }).distinct('_id') };
    }
    const exercices = await Exercise.find(filter, 'numero titre niveau duree chapter statut auteur')
      .populate('chapter', 'titre matiere ordre')
      .populate('auteur', 'nom')
      .limit(100)
      .lean();
    exercices.sort(
      (a, b) =>
        (a.chapter?.matiere || '').localeCompare(b.chapter?.matiere || '') ||
        (a.chapter?.ordre || 0) - (b.chapter?.ordre || 0) ||
        a.numero - b.numero
    );
    const prog = await Progress.find({ user: req.user._id }, 'exercise').lean();
    const done = new Set(prog.map((p) => String(p.exercise)));
    res.json(exercices.map((e) => ({ ...e, resolu: done.has(String(e._id)) })));
  })
);

// Charge un exercice en respectant la visibilité des propositions.
async function visible(req, champs) {
  const e = await Exercise.findById(req.params.id, champs).lean();
  const cache = e && e.statut === 'propose' && !estEnseignant(req.user) && String(e.auteur) !== String(req.user._id);
  if (!e || cache) throw httpError(404, 'Exercice introuvable.');
  return e;
}

r.get(
  '/exercises/:id',
  ah(async (req, res) => {
    const full = await visible(req);
    const { indice, correction, ...e } = full;
    const [chapter, resolu, nbSolutions] = await Promise.all([
      Chapter.findById(e.chapter, 'titre matiere classe').lean(),
      Progress.exists({ user: req.user._id, exercise: e._id }),
      Solution.countDocuments({ exercise: e._id }),
    ]);
    res.json({ ...e, chapter, resolu: Boolean(resolu), nbSolutions, aIndice: Boolean(indice), aCorrection: Boolean(correction) });
  })
);

// Indice et correction sont servis à la demande : rien n'est téléchargé tant que l'élève ne le veut pas.
for (const champ of ['indice', 'correction']) {
  r.get(
    `/exercises/:id/${champ}`,
    ah(async (req, res) => {
      const e = await visible(req, `${champ} statut auteur`);
      res.json({ [champ]: e[champ] || '' });
    })
  );
}

r.post(
  '/exercises/:id/resolu',
  ah(async (req, res) => {
    const e = await visible(req, 'chapter statut auteur');
    if (req.body.resolu === false) {
      await Progress.deleteOne({ user: req.user._id, exercise: e._id });
    } else {
      await Progress.updateOne({ user: req.user._id, exercise: e._id }, { $set: { chapter: e.chapter } }, { upsert: true });
      await touchPractice(req.user._id);
    }
    res.json({ resolu: req.body.resolu !== false });
  })
);

// Tout membre peut proposer un exercice ; celui d'un élève attend la validation d'un enseignant.
r.post(
  '/exercises',
  ah(async (req, res) => {
    const chapter = await Chapter.findById(str(req.body.chapter, 40)).lean();
    if (!chapter) throw httpError(400, 'Choisis un chapitre.');
    const titre = str(req.body.titre, 140);
    const enonce = str(req.body.enonce, 10000);
    if (!titre || !enonce) throw httpError(400, 'Titre et énoncé sont obligatoires.');
    const statut = estEnseignant(req.user) ? 'publie' : 'propose';
    if (statut === 'propose' && (await Exercise.countDocuments({ auteur: req.user._id, statut: 'propose' })) >= 10)
      throw httpError(429, 'Tu as déjà 10 propositions en attente de validation.');
    const e = await Exercise.create({
      chapter: chapter._id,
      numero: (await Exercise.countDocuments({ chapter: chapter._id, ...PUBLIE })) + 1,
      titre,
      enonce,
      statut,
      niveau: ['Facile', 'Intermédiaire', 'Difficile'].includes(req.body.niveau) ? req.body.niveau : 'Intermédiaire',
      duree: Math.min(240, Math.max(1, parseInt(req.body.duree, 10) || 15)),
      indice: str(req.body.indice, 4000),
      correction: str(req.body.correction, 20000),
      auteur: req.user._id,
    });
    await touchPractice(req.user._id);
    res.status(201).json({ _id: e._id, statut });
  })
);

r.post(
  '/exercises/:id/publier',
  requireTeacher,
  ah(async (req, res) => {
    const e = await Exercise.findById(req.params.id);
    if (!e) throw httpError(404, 'Exercice introuvable.');
    if (e.statut === 'propose') {
      e.numero = (await Exercise.countDocuments({ chapter: e.chapter, ...PUBLIE })) + 1;
      e.statut = 'publie';
      await e.save();
    }
    res.json({ statut: e.statut });
  })
);

// Un enseignant peut supprimer tout exercice ; un élève, seulement sa proposition encore en attente.
r.delete(
  '/exercises/:id',
  ah(async (req, res) => {
    const e = await Exercise.findById(req.params.id);
    if (!e) throw httpError(404, 'Exercice introuvable.');
    const sien = e.statut === 'propose' && String(e.auteur) === String(req.user._id);
    if (!estEnseignant(req.user) && !sien) throw httpError(403, 'Action non autorisée.');
    await Promise.all([e.deleteOne(), Progress.deleteMany({ exercise: e._id }), Solution.deleteMany({ exercise: e._id })]);
    res.status(204).end();
  })
);

export default r;
