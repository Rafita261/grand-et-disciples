import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { ah, httpError, str, signToken, requireAuth, loginLimiter, publicUser } from '../util.js';

const r = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

r.post(
  '/auth/register',
  loginLimiter,
  ah(async (req, res) => {
    const nom = str(req.body.nom, 60);
    const email = str(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (nom.length < 2) throw httpError(400, 'Indique ton nom.');
    if (!EMAIL.test(email)) throw httpError(400, 'Adresse e-mail invalide.');
    if (password.length < 8) throw httpError(400, 'Mot de passe : 8 caractères minimum.');

    let role = 'eleve';
    if (req.body.role === 'enseignant') {
      if (!process.env.TEACHER_CODE || str(req.body.codeEnseignant, 100) !== process.env.TEACHER_CODE)
        throw httpError(403, 'Code enseignant incorrect.');
      role = 'enseignant';
    }
    if (await User.exists({ email })) throw httpError(409, 'Un compte existe déjà avec cet e-mail.');

    const user = await User.create({
      nom,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      classe: str(req.body.classe, 30) || 'Terminale',
      serie: str(req.body.serie, 10) || 'C',
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

r.post(
  '/auth/login',
  loginLimiter,
  ah(async (req, res) => {
    const email = str(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw httpError(401, 'E-mail ou mot de passe incorrect.');
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

r.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

r.patch(
  '/auth/me',
  requireAuth,
  ah(async (req, res) => {
    const u = req.user;
    const b = req.body;
    if (typeof b.nom === 'string' && str(b.nom, 60).length >= 2) u.nom = str(b.nom, 60);
    if (typeof b.classe === 'string') u.classe = str(b.classe, 30) || u.classe;
    if (typeof b.serie === 'string') u.serie = str(b.serie, 10) || u.serie;
    if (typeof b.profilPublic === 'boolean') u.profilPublic = b.profilPublic;
    if (Number.isInteger(b.objectifHebdo)) u.objectifHebdo = Math.min(7, Math.max(1, b.objectifHebdo));
    if (Array.isArray(b.objectifs))
      u.objectifs = b.objectifs
        .slice(0, 20)
        .map((o) => ({ texte: str(o?.texte, 120), fait: Boolean(o?.fait) }))
        .filter((o) => o.texte);
    await u.save();
    res.json({ user: publicUser(u) });
  })
);

export default r;
