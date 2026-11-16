import { Router } from 'express';
import { User, Exercise, Progress, Solution, Work, Annale, Attempt } from '../models.js';
import { ah, httpError, requireAuth } from '../util.js';
import { chaptersWithProgress, PUBLIE } from './content.js';

const r = Router();
r.use(requireAuth);

// Jours (AAAA-MM-JJ) de la semaine en cours, du lundi au dimanche.
function semaine() {
  const d = new Date();
  const lundi = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
  return Array.from({ length: 7 }, (_, i) => new Date(lundi.getTime() + i * 86400000).toISOString().slice(0, 10));
}

r.get(
  '/dashboard',
  ah(async (req, res) => {
    const u = req.user;
    const { chapters, dernier } = await chaptersWithProgress(u._id);

    const parMatiere = {};
    chapters.forEach((c) => (parMatiere[c.matiere] ||= []).push(c));
    const courant = (liste) => liste.find((c) => c.pct < 100) || liste[liste.length - 1];
    const matieres = Object.entries(parMatiere).map(([matiere, liste]) => {
      const c = courant(liste);
      return { matiere, chapitre: c.titre, chapitreId: c._id, pct: c.pct };
    });

    const dernierCh = chapters.find((c) => String(c._id) === dernier && c.pct < 100);
    const reprendre = dernierCh || (chapters.length ? courant(parMatiere['Mathématiques'] || chapters) : null);

    let parcours = [];
    const aFaire = [];
    if (reprendre) {
      let vuCourant = false;
      parcours = parMatiere[reprendre.matiere].map((c) => {
        let statut = 'a-venir';
        if (c.pct === 100) statut = 'termine';
        else if (!vuCourant) {
          statut = 'en-cours';
          vuCourant = true;
        }
        return { _id: c._id, titre: c.titre, pct: c.pct, statut };
      });
      const faits = await Progress.find({ user: u._id, chapter: reprendre._id }).distinct('exercise');
      const exo = await Exercise.findOne({ chapter: reprendre._id, _id: { $nin: faits }, ...PUBLIE }, 'titre duree').sort({ numero: 1 }).lean();
      if (exo) aFaire.push({ type: 'exercice', _id: exo._id, titre: `Exercice : ${exo.titre}`, sousTitre: reprendre.titre, duree: exo.duree });
    }
    const tentes = await Attempt.find({ user: u._id }).distinct('annale');
    const sujet = await Annale.findOne({ serie: u.serie, _id: { $nin: tentes } }, 'titre matiere dureeMin').lean();
    if (sujet) aFaire.push({ type: 'annale', _id: sujet._id, titre: sujet.titre, sousTitre: sujet.matiere, duree: sujet.dureeMin });

    const jours = semaine();
    res.json({
      reprendre: reprendre && { _id: reprendre._id, matiere: reprendre.matiere, titre: reprendre.titre, resume: reprendre.resume, pct: reprendre.pct },
      objectif: { fait: jours.filter((j) => u.joursPratique.includes(j)).length, cible: u.objectifHebdo },
      matieres,
      parcours,
      aFaire,
    });
  })
);

async function profil(user, prive) {
  const [resolus, solutions, travaux, attempts, { chapters }] = await Promise.all([
    Progress.countDocuments({ user: user._id }),
    Solution.find({ auteur: user._id }, 'exercise validee createdAt').populate('exercise', 'titre').sort({ createdAt: -1 }).limit(20).lean(),
    Work.find({ auteur: user._id, publie: true }, 'titre updatedAt').sort({ updatedAt: -1 }).limit(20).lean(),
    Attempt.find({ user: user._id, note: { $ne: null } }, 'note fin annale').populate('annale', 'titre').sort({ fin: 1 }).lean(),
    chaptersWithProgress(user._id),
  ]);
  return {
    user: { _id: user._id, nom: user.nom, role: user.role, classe: user.classe, serie: user.serie, profilPublic: user.profilPublic },
    stats: { resolus, solutions: solutions.length, jours: user.joursPratique.length },
    progression: attempts.slice(-8).map((a) => ({ note: a.note, date: a.fin, titre: a.annale?.titre })),
    competences: chapters.filter((c) => c.total > 0 && (c.resolus > 0 || c.matiere === 'Mathématiques')).map((c) => ({ titre: c.titre, matiere: c.matiere, pct: c.pct })),
    contributions: {
      solutions: solutions.filter((s) => s.exercise).map((s) => ({ _id: s._id, exercise: s.exercise._id, titre: s.exercise.titre, validee: s.validee })),
      travaux,
    },
    ...(prive ? { objectifs: user.objectifs, objectifHebdo: user.objectifHebdo, email: user.email } : {}),
  };
}

r.get('/profile', ah(async (req, res) => res.json(await profil(req.user, true))));

r.get(
  '/users/:id/profile',
  ah(async (req, res) => {
    const u = await User.findById(req.params.id);
    const moi = u && String(u._id) === String(req.user._id);
    if (!u || (!u.profilPublic && !moi)) throw httpError(404, "Ce profil n'est pas visible.");
    res.json(await profil(u, false));
  })
);

export default r;
