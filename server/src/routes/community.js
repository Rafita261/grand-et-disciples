import { Router } from 'express';
import { Exercise, Solution, Comment, Work } from '../models.js';
import { ah, httpError, str, requireAuth, requireTeacher, touchPractice } from '../util.js';

const r = Router();
r.use(requireAuth);

const AUTEUR = 'nom role classe';

const vueSolution = (s, userId) => ({
  _id: s._id,
  exercise: s.exercise,
  auteur: s.auteur,
  contenu: s.contenu,
  utile: s.utile.length,
  monVote: s.utile.some((u) => String(u) === String(userId)),
  validee: s.validee,
  createdAt: s.createdAt,
});

r.get(
  '/exercises/:id/solutions',
  ah(async (req, res) => {
    const list = await Solution.find({ exercise: req.params.id }).populate('auteur', AUTEUR).limit(50).lean();
    if (req.query.tri === 'recentes') list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => b.validee - a.validee || b.utile.length - a.utile.length || b.createdAt - a.createdAt);
    res.json(list.map((s) => vueSolution(s, req.user._id)));
  })
);

r.post(
  '/exercises/:id/solutions',
  ah(async (req, res) => {
    const contenu = str(req.body.contenu, 20000);
    if (contenu.length < 10) throw httpError(400, 'Ta solution est trop courte.');
    if (!(await Exercise.exists({ _id: req.params.id }))) throw httpError(404, 'Exercice introuvable.');
    const s = await Solution.create({ exercise: req.params.id, auteur: req.user._id, contenu });
    await touchPractice(req.user._id);
    res.status(201).json({ _id: s._id });
  })
);

r.post(
  '/solutions/:id/utile',
  ah(async (req, res) => {
    const s = await Solution.findById(req.params.id);
    if (!s) throw httpError(404, 'Solution introuvable.');
    const i = s.utile.findIndex((u) => String(u) === String(req.user._id));
    if (i >= 0) s.utile.splice(i, 1);
    else s.utile.push(req.user._id);
    await s.save();
    res.json({ utile: s.utile.length, monVote: i < 0 });
  })
);

r.post(
  '/solutions/:id/valider',
  requireTeacher,
  ah(async (req, res) => {
    const validee = req.body.validee !== false;
    const s = await Solution.findByIdAndUpdate(
      req.params.id,
      { validee, valideePar: validee ? req.user._id : undefined },
      { new: true }
    );
    if (!s) throw httpError(404, 'Solution introuvable.');
    res.json({ validee: s.validee });
  })
);

r.delete(
  '/solutions/:id',
  ah(async (req, res) => {
    const s = await Solution.findById(req.params.id);
    if (!s) throw httpError(404, 'Solution introuvable.');
    if (String(s.auteur) !== String(req.user._id) && req.user.role === 'eleve') throw httpError(403, 'Action non autorisée.');
    await s.deleteOne();
    res.status(204).end();
  })
);

// Discussions : rattachées à un exercice ou à un travail publié.
r.get(
  '/comments',
  ah(async (req, res) => {
    const filter = req.query.work ? { work: str(req.query.work, 40) } : { exercise: str(req.query.exercise, 40) };
    res.json(await Comment.find(filter).populate('auteur', AUTEUR).sort({ createdAt: 1 }).limit(100).lean());
  })
);

r.post(
  '/comments',
  ah(async (req, res) => {
    const texte = str(req.body.texte, 4000);
    if (texte.length < 2) throw httpError(400, 'Message vide.');
    const doc = { auteur: req.user._id, texte };
    if (req.body.work) {
      if (!(await Work.exists({ _id: str(req.body.work, 40), publie: true }))) throw httpError(404, 'Travail introuvable.');
      doc.work = req.body.work;
    } else {
      if (!(await Exercise.exists({ _id: str(req.body.exercise, 40) }))) throw httpError(404, 'Exercice introuvable.');
      doc.exercise = req.body.exercise;
    }
    const c = await Comment.create(doc);
    res.status(201).json({ _id: c._id });
  })
);

r.get(
  '/community/feed',
  ah(async (req, res) => {
    const [solutions, travaux, discussions] = await Promise.all([
      Solution.find({}, 'exercise auteur validee utile createdAt')
        .populate('auteur', AUTEUR)
        .populate('exercise', 'titre')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      Work.find({ publie: true, exercise: null }, 'titre auteur updatedAt').populate('auteur', AUTEUR).sort({ updatedAt: -1 }).limit(15).lean(),
      Comment.find({ exercise: { $ne: null } }, 'exercise auteur texte createdAt')
        .populate('auteur', AUTEUR)
        .populate('exercise', 'titre')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);
    res.json({
      solutions: solutions.filter((s) => s.exercise).map((s) => ({ ...s, utile: s.utile.length })),
      travaux,
      discussions: discussions.filter((d) => d.exercise),
    });
  })
);

r.get(
  '/community/works/:id',
  ah(async (req, res) => {
    const w = await Work.findOne({ _id: req.params.id, publie: true }, 'titre format enonce contenu auteur updatedAt')
      .populate('auteur', AUTEUR)
      .lean();
    if (!w) throw httpError(404, 'Travail introuvable.');
    res.json(w);
  })
);

export default r;
