# Entraide

Application web de révision et d'entraide pour le bac : cours, exercices, solutions de la communauté,
éditeur de copies (texte simple ou LaTeX), correction automatique par Gemini, annales et simulations d'examen.

- `client/` — React 18 + Vite (mobile d'abord, installable, lecture hors ligne)
- `server/` — Express + MongoDB (Mongoose) + API Gemini

## Démarrage

Prérequis : Node.js 18.17 ou plus, MongoDB (local ou Atlas).

```bash
# 1. API
cd server
npm install
# renseigner server/.env (voir ci-dessous)
npm run seed        # contenu de démonstration — EFFACE la base
npm run dev         # http://localhost:4000

# 2. Interface (autre terminal)
cd client
npm install
npm run dev         # http://localhost:5173
```

Comptes de démonstration (mot de passe `demo1234`) : `eleve@demo.mg`, `prof@demo.mg`.

## Configuration (`server/.env`)

| Variable | Rôle |
| --- | --- |
| `MONGODB_URI` | Adresse de la base |
| `JWT_SECRET` | Secret des sessions — à changer absolument en production |
| `TEACHER_CODE` | Code demandé à l'inscription pour être enseignant |
| `GEMINI_API_KEYS` | Une ou plusieurs clés Gemini séparées par des virgules. Si une clé atteint son quota ou est refusée, le serveur passe à la suivante. **Vide = fonctions IA désactivées** |
| `GEMINI_MODEL` | Modèle utilisé (`gemini-3.6-flash` par défaut) |
| `AI_HOURLY_LIMIT` | Appels IA par élève et par heure |

## Production

```bash
cd client && npm install --include=dev && npm run build
cd ../server && npm install && NODE_ENV=production npm start
```

Le serveur Express distribue alors `client/dist` : un seul service à héberger.

## Rôles

- **Enseignant** (inscription avec `TEACHER_CODE`) : crée et modifie les chapitres et les sujets d'examen, publie des exercices, valide les solutions et les exercices proposés.
- **Élève** : peut proposer un exercice ; il reste dans « Propositions en attente » jusqu'à sa publication par un enseignant.

## Ce que fait l'IA (Gemini)

- **Analyser ma solution / Corriger avec l'IA** (éditeur et page d'un exercice) : vérification étape par étape, note privée sur 20, et démarche de l'élève réécrite en LaTeX, publiable ensuite comme proposition de correction.
- **Photo / PDF** : disponible dans l'éditeur, le formulaire d'exercice (énoncé, correction) et le formulaire de chapitre ; transcription d'une copie en texte simple ou en LaTeX (photo compressée sur le téléphone avant envoi).
- **Convertir en LaTeX** : pour ceux qui écrivent en texte simple.
- **Simulation** : note estimée par exercice. Sans clé, l'élève s'auto-évalue à partir du corrigé.

Tout retour de l'IA est affiché comme « à vérifier » ; la validation des solutions reste aux enseignants.

## Économie de données

- aucune police ni image distante, icônes en SVG intégré ;
- pages chargées à la demande, KaTeX téléchargé seulement à la première formule ;
- réponses compressées (gzip), fichiers mis en cache longue durée ;
- service worker : l'application et les pages déjà consultées restent lisibles hors ligne ;
- indices et corrections téléchargés uniquement quand l'élève les demande.
