import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Connexion from './pages/Connexion.jsx';
import Accueil from './pages/Accueil.jsx';

// Chaque page est un fichier séparé, téléchargé seulement quand on l'ouvre.
const Revisions = lazy(() => import('./pages/Revisions.jsx'));
const Chapitre = lazy(() => import('./pages/Chapitre.jsx'));
const ChapitreForm = lazy(() => import('./pages/ChapitreForm.jsx'));
const Exercices = lazy(() => import('./pages/Exercices.jsx'));
const Exercice = lazy(() => import('./pages/Exercice.jsx'));
const NouvelExercice = lazy(() => import('./pages/NouvelExercice.jsx'));
const Travaux = lazy(() => import('./pages/Travaux.jsx'));
const Editeur = lazy(() => import('./pages/Editeur.jsx'));
const Annales = lazy(() => import('./pages/Annales.jsx'));
const Sujet = lazy(() => import('./pages/Sujet.jsx'));
const SujetForm = lazy(() => import('./pages/SujetForm.jsx'));
const Simulation = lazy(() => import('./pages/Simulation.jsx'));
const Bilan = lazy(() => import('./pages/Bilan.jsx'));
const Examens = lazy(() => import('./pages/Examens.jsx'));
const Communaute = lazy(() => import('./pages/Communaute.jsx'));
const TravailPublic = lazy(() => import('./pages/TravailPublic.jsx'));
const Profil = lazy(() => import('./pages/Profil.jsx'));

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted pad">Chargement…</p>;
  if (!user)
    return (
      <Routes>
        <Route path="/connexion" element={<Connexion />} />
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    );
  return (
    <Layout>
      <Suspense fallback={<p className="muted pad">Chargement…</p>}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/revisions" element={<Revisions />} />
          <Route path="/revisions/nouveau" element={<ChapitreForm />} />
          <Route path="/revisions/:id" element={<Chapitre />} />
          <Route path="/revisions/:id/modifier" element={<ChapitreForm />} />
          <Route path="/exercices" element={<Exercices />} />
          <Route path="/exercices/nouveau" element={<NouvelExercice />} />
          <Route path="/exercices/:id" element={<Exercice />} />
          <Route path="/travaux" element={<Travaux />} />
          <Route path="/travaux/:id" element={<Editeur />} />
          <Route path="/annales" element={<Annales />} />
          <Route path="/annales/nouveau" element={<SujetForm />} />
          <Route path="/annales/:id" element={<Sujet />} />
          <Route path="/annales/:id/modifier" element={<SujetForm />} />
          <Route path="/simulation/:id" element={<Simulation />} />
          <Route path="/bilan/:id" element={<Bilan />} />
          <Route path="/examens" element={<Examens />} />
          <Route path="/communaute" element={<Communaute />} />
          <Route path="/communaute/travaux/:id" element={<TravailPublic />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/profil/:id" element={<Profil />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
