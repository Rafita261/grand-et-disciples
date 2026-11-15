import { Router } from 'express';
import { Chapter, Exercise, Progress, Solution } from '../models.js';
import { ah, httpError, str, escapeRegex, requireAuth, requireTeacher, touchPractice } from '../util.js';

const r = Router();
r.use(requireAuth);

/** Chapitres enrichis de la progression de l'élève. */
export async function chaptersWithProgress(userId, filter = {}) {
  const [chapters, exos, prog] = await Promise.all([
    Chapter.find(filter, '-contenu').sort({ matiere: 1, ordre: 1 }).lean(),
    Exercise.find({}, 'chapter').lean(),
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

r.get(
  '/chapters',
  ah(async (req, res) => {
    const filter = req.query.matiere ? { matiere: str(req.query.matiere, 60) } : {};
    res.json((await chaptersWithProgress(req.user._id, filter)).chapters);
  })
);

r.get(
  '/chapters/:id',
  ah(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).lean();
    if (!chapter) throw httpError(404, 'Chapitre introuvable.');
    const [exercices, prog] = await Promise.all([
      Exercise.find({ chapter: chapter._id }, 'numero titre niveau duree').sort({ numero: 1 }).lean(),
      Progress.find({ user: req.user._id, chapter: chapter._id }, 'exercise').lean(),
    ]);
    const done = new Set(prog.map((p) => String(p.exercise)));
    res.json({ ...chapter, exercices: exercices.map((e) => ({ ...e, resolu: done.has(String(e._id)) })) });
  })
);

r.get(
  '/exercises',
  ah(async (req, res) => {
    const filter = {};
    if (req.query.chapter) filter.chapter = str(req.query.chapter, 40);
    if (req.query.niveau) filter.niveau = str(req.query.niveau, 20);
    if (req.query.q) filter.titre = new RegExp(escapeRegex(str(req.query.q, 60)), 'i');
    if (req.query.matiere) {
      const ids = await Chapter.find({ matiere: str(req.query.matiere, 60) }).distinct('_id');
      filter.chapter = filter.chapter || { $in: ids };
    }
    const exercices = await Exercise.find(filter, 'numero titre niveau duree chapter')
      .populate('chapter', 'titre matiere ordre')
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

r.get(
  '/exercises/:id',
  ah(async (req, res) => {
    const e = await Exercise.findById(req.params.id, '-indice -correction').populate('chapter', 'titre matiere classe').lean();
    if (!e) throw httpError(404, 'Exercice introuvable.');
    const [resolu, nbSolutions, full] = await Promise.all([
      Progress.exists({ user: req.user._id, exercise: e._id }),
      Solution.countDocuments({ exercise: e._id }),
      Exercise.findById(e._id, 'indice correction').lean(),
    ]);
    res.json({ ...e, resolu: Boolean(resolu), nbSolutions, aIndice: Boolean(full.indice), aCorrection: Boolean(full.correction) });
  })
);

// Indice et correction sont servis à la demande : rien n'est téléchargé tant que l'élève ne le veut pas.
for (const champ of ['indice', 'correction']) {
  r.get(
    `/exercises/:id/${champ}`,
    ah(async (req, res) => {
      const e = await Exercise.findById(req.params.id, champ).lean();
      if (!e) throw httpError(404, 'Exercice introuvable.');
      res.json({ [champ]: e[champ] || '' });
    })
  );
}

r.post(
  '/exercises/:id/resolu',
  ah(async (req, res) => {
    const e = await Exercise.findById(req.params.id, 'chapter').lean();
    if (!e) throw httpError(404, 'Exercice introuvable.');
    if (req.body.resolu === false) {
      await Progress.deleteOne({ user: req.user._id, exercise: e._id });
    } else {
      await Progress.updateOne(
        { user: req.user._id, exercise: e._id },
        { $set: { chapter: e.chapter } },
        { upsert: true }
      );
      await touchPractice(req.user._id);
    }
    res.json({ resolu: req.body.resolu !== false });
  })
);

r.post(
  '/exercises',
  requireTeacher,
  ah(async (req, res) => {
    const chapter = await Chapter.findById(str(req.body.chapter, 40)).lean();
    if (!chapter) throw httpError(400, 'Chapitre invalide.');
    const titre = str(req.body.titre, 140);
    const enonce = str(req.body.enonce, 10000);
    if (!titre || !enonce) throw httpError(400, 'Titre et énoncé sont obligatoires.');
    const numero = (await Exercise.countDocuments({ chapter: chapter._id })) + 1;
    const e = await Exercise.create({
      chapter: chapter._id,
      numero,
      titre,
      enonce,
      niveau: ['Facile', 'Intermédiaire', 'Difficile'].includes(req.body.niveau) ? req.body.niveau : 'Intermédiaire',
      duree: Math.min(240, Math.max(1, parseInt(req.body.duree, 10) || 15)),
      indice: str(req.body.indice, 4000),
      correction: str(req.body.correction, 20000),
      auteur: req.user._id,
    });
    res.status(201).json({ _id: e._id });
  })
);

export default r;
