import { Router } from 'express';
import { Annale, Attempt } from '../models.js';
import { ah, httpError, str, requireAuth, requireTeacher, touchPractice } from '../util.js';
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

/* ---------- Gestion des sujets (enseignants) ---------- */

function champsSujet(b) {
  const texte = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const doc = {
    matiere: str(b.matiere, 60),
    serie: str(b.serie, 10),
    titre: str(b.titre, 140),
    type: str(b.type, 60) || "Sujet d'entraînement",
    annee: parseInt(b.annee, 10) || undefined,
    dureeMin: Math.min(600, Math.max(5, parseInt(b.dureeMin, 10) || 180)),
    exercices: (Array.isArray(b.exercices) ? b.exercices : []).slice(0, 20).map((e) => ({
      titre: str(e?.titre, 140),
      theme: str(e?.theme, 60) || str(e?.titre, 60),
      points: Math.min(100, Math.max(0.5, Number(e?.points) || 5)),
      enonce: texte(e?.enonce, 20000),
      corrige: texte(e?.corrige, 20000),
    })),
  };
  if (!doc.matiere || !doc.serie || !doc.titre) throw httpError(400, 'Matière, série et titre sont obligatoires.');
  if (!doc.exercices.length) throw httpError(400, 'Ajoute au moins un exercice.');
  if (doc.exercices.some((e) => !e.titre || !e.enonce.trim())) throw httpError(400, 'Chaque exercice doit avoir un titre et un énoncé.');
  return doc;
}

r.post(
  '/annales',
  requireTeacher,
  ah(async (req, res) => {
    const a = await Annale.create(champsSujet(req.body));
    res.status(201).json({ _id: a._id });
  })
);

r.put(
  '/annales/:id',
  requireTeacher,
  ah(async (req, res) => {
    const a = await Annale.findById(req.params.id);
    if (!a) throw httpError(404, 'Sujet introuvable.');
    const doc = champsSujet(req.body);
    // Changer le nombre d'exercices fausserait les copies déjà rendues ou en cours.
    if (doc.exercices.length !== a.exercices.length && (await Attempt.exists({ annale: a._id })))
      throw httpError(409, 'Des élèves ont déjà composé sur ce sujet : le nombre d’exercices ne peut plus changer.');
    a.set(doc);
    if (!doc.annee) a.annee = undefined;
    await a.save();
    res.json({ _id: a._id });
  })
);

r.delete(
  '/annales/:id',
  requireTeacher,
  ah(async (req, res) => {
    if (await Attempt.exists({ annale: req.params.id }))
      throw httpError(409, 'Des élèves ont déjà composé sur ce sujet : il ne peut plus être supprimé.');
    await Annale.deleteOne({ _id: req.params.id });
    res.status(204).end();
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
