import { Router } from 'express';
import { Annale, Attempt } from '../models.js';
import { ah, httpError, str, requireAuth, touchPractice } from '../util.js';
import { aiEnabled, noterExamen } from '../gemini.js';

const r = Router();
r.use(requireAuth);

const sansCorrige = (a) => ({ ...a, exercices: a.exercices.map(({ corrige, ...e }) => e) });
const noteSur20 = (detail) => {
  const sur = detail.reduce((s, d) => s + d.sur, 0);
  const pts = detail.reduce((s, d) => s + d.points, 0);
  return sur ? Math.round((pts / sur) * 40) / 2 : 0;
};

r.get(
  '/annales',
  ah(async (req, res) => {
    const f = {};
    if (req.query.matiere) f.matiere = str(req.query.matiere, 60);
    if (req.query.serie) f.serie = str(req.query.serie, 10);
    if (req.query.annee) f.annee = parseInt(req.query.annee, 10) || undefined;
    const list = await Annale.find(f, 'matiere serie annee titre type dureeMin exercices.points').sort({ annee: -1, titre: 1 }).lean();
    res.json(
      list.map(({ exercices, ...a }) => ({ ...a, nbExercices: exercices.length, total: exercices.reduce((s, e) => s + (e.points || 0), 0) }))
    );
  })
);

r.get(
  '/annales/:id',
  ah(async (req, res) => {
    const a = await Annale.findById(req.params.id).lean();
    if (!a) throw httpError(404, 'Sujet introuvable.');
    res.json(req.query.corrige === '1' ? a : sansCorrige(a));
  })
);

// Démarre une simulation, ou reprend celle en cours sur le même sujet.
r.post(
  '/annales/:id/attempts',
  ah(async (req, res) => {
    const a = await Annale.findById(req.params.id, '_id').lean();
    if (!a) throw httpError(404, 'Sujet introuvable.');
    const enCours = await Attempt.findOne({ user: req.user._id, annale: a._id, fin: null });
    const attempt = enCours || (await Attempt.create({ user: req.user._id, annale: a._id }));
    res.status(enCours ? 200 : 201).json({ _id: attempt._id });
  })
);

r.get(
  '/attempts',
  ah(async (req, res) => {
    res.json(
      await Attempt.find({ user: req.user._id }, 'annale debut fin note estimation')
        .populate('annale', 'titre matiere serie dureeMin')
        .sort({ debut: -1 })
        .limit(50)
        .lean()
    );
  })
);

const load = async (req) => {
  const at = await Attempt.findOne({ _id: req.params.id, user: req.user._id });
  if (!at) throw httpError(404, 'Simulation introuvable.');
  return at;
};

r.get(
  '/attempts/:id',
  ah(async (req, res) => {
    const at = await load(req);
    const annale = await Annale.findById(at.annale).lean();
    if (!annale) throw httpError(404, 'Sujet introuvable.');
    // Le corrigé n'est envoyé qu'une fois la copie remise.
    res.json({ ...at.toObject(), annale: at.fin ? annale : sansCorrige(annale) });
  })
);

r.put(
  '/attempts/:id/reponse',
  ah(async (req, res) => {
    const at = await load(req);
    if (at.fin) throw httpError(409, 'Cette simulation est terminée.');
    const index = parseInt(req.body.index, 10);
    if (!(index >= 0 && index < 20)) throw httpError(400, 'Exercice invalide.');
    const texte = typeof req.body.texte === 'string' ? req.body.texte.slice(0, 20000) : '';
    const rep = at.reponses.find((x) => x.index === index);
    if (rep) rep.texte = texte;
    else at.reponses.push({ index, texte });
    await at.save();
    res.json({ ok: true });
  })
);

r.post(
  '/attempts/:id/terminer',
  ah(async (req, res) => {
    const at = await load(req);
    if (!at.fin) {
      const annale = await Annale.findById(at.annale).lean();
      at.fin = new Date();
      at.detail = annale.exercices.map((e, i) => ({ index: i, theme: e.theme, points: 0, sur: e.points, commentaire: '' }));
      if (aiEnabled()) {
        try {
          const notes = await noterExamen(annale.exercices, at.reponses);
          at.detail.forEach((d) => Object.assign(d, notes.find((n) => n.index === d.index) || {}));
          at.estimation = 'ia';
          at.note = noteSur20(at.detail);
        } catch (e) {
          console.error('Notation IA impossible :', e.message); // l'élève pourra s'auto-évaluer
        }
      }
      await at.save();
      await touchPractice(req.user._id);
    }
    res.json({ _id: at._id });
  })
);

// Sans IA (ou en complément), l'élève se note lui-même à partir du corrigé.
r.post(
  '/attempts/:id/autoeval',
  ah(async (req, res) => {
    const at = await load(req);
    if (!at.fin) throw httpError(409, "Termine d'abord la simulation.");
    const points = Array.isArray(req.body.points) ? req.body.points : [];
    at.detail.forEach((d, i) => {
      const p = Number(points[i]);
      d.points = Number.isFinite(p) ? Math.max(0, Math.min(d.sur, Math.round(p * 2) / 2)) : 0;
    });
    at.estimation = 'auto';
    at.note = noteSur20(at.detail);
    await at.save();
    res.json({ note: at.note });
  })
);

export default r;
