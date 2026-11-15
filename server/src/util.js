import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from './models.js';

export const httpError = (status, message) => Object.assign(new Error(message), { status });

// Enveloppe les handlers async pour transmettre les erreurs à Express 4.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const today = () => new Date().toISOString().slice(0, 10);

const secret = () => process.env.JWT_SECRET || 'dev-secret';

export const signToken = (user) => jwt.sign({ id: String(user._id) }, secret(), { expiresIn: '30d' });

export const requireAuth = ah(async (req, _res, next) => {
  if (req.user) return next(); // déjà authentifié par un routeur précédent
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw httpError(401, 'Connexion requise.');
  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    throw httpError(401, 'Session expirée, reconnecte-toi.');
  }
  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, 'Compte introuvable.');
  req.user = user;
  next();
});

export const requireTeacher = (req, _res, next) =>
  ['enseignant', 'admin'].includes(req.user.role) ? next() : next(httpError(403, 'Réservé aux enseignants.'));

// Compte la journée comme « jour de pratique ».
export const touchPractice = (userId) => User.updateOne({ _id: userId }, { $addToSet: { joursPratique: today() } });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessaie dans quelques minutes.' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: () => Number(process.env.AI_HOURLY_LIMIT || 30),
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite d'utilisation de l'IA atteinte pour cette heure." },
});

export const publicUser = (u) => ({
  _id: u._id,
  nom: u.nom,
  email: u.email,
  role: u.role,
  classe: u.classe,
  serie: u.serie,
  profilPublic: u.profilPublic,
  objectifHebdo: u.objectifHebdo,
  objectifs: u.objectifs,
});
