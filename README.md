# CarrièrePilot — Frontend

> Plateforme SaaS de recherche d'emploi boostée par IA. Créez des CVs optimisés ATS, générez des lettres de motivation personnalisées, suivez vos candidatures en Kanban et préparez vos entretiens avec l'intelligence artificielle.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styles** : TailwindCSS 3 + CSS Variables
- **Animations** : Framer Motion 11
- **État global** : Zustand
- **Data fetching** : TanStack Query v5
- **Formulaires** : React Hook Form + Zod
- **HTTP** : Axios (token en mémoire, refresh httpOnly cookie)
- **DnD** : @dnd-kit
- **Charts** : Recharts
- **Toast** : react-hot-toast

## Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd carrieres-pilot

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Lancer en développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend (ex: `http://localhost:4000`) |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Price ID Stripe pour le plan Pro |
| `NEXT_PUBLIC_STRIPE_EXPERT_PRICE_ID` | Price ID Stripe pour le plan Expert |

## Structure du projet

```
src/
├── app/
│   ├── (public)/          # Pages publiques (landing, auth)
│   │   ├── page.tsx       # Landing page
│   │   ├── connexion/     # Page de connexion
│   │   └── inscription/   # Page d'inscription
│   └── (app)/             # Pages authentifiées
│       ├── dashboard/     # Tableau de bord
│       ├── cv/            # Gestion des CVs
│       ├── candidatures/  # Kanban des candidatures
│       ├── offres/        # Offres d'emploi
│       ├── lettre/        # Lettres de motivation
│       ├── entretiens/    # Préparation entretiens
│       ├── profil/        # Profil utilisateur
│       └── abonnement/    # Gestion du plan
├── components/
│   ├── ui/                # Composants de base (Button, Input, Badge…)
│   ├── shared/            # Composants partagés (Navbar, Sidebar…)
│   ├── landing/           # Sections de la landing page
│   └── cv/                # Éditeur de CV
├── lib/
│   ├── axios.ts           # Instance Axios avec intercepteurs
│   ├── animations.ts      # Variants Framer Motion
│   └── utils.ts           # Utilitaires (cn)
├── stores/
│   ├── authStore.ts       # Store Zustand auth
│   └── uiStore.ts         # Store Zustand UI
└── types/
    └── index.ts           # Interfaces TypeScript
```

## Authentification

- **Access token** : JWT 15 min stocké en mémoire (Zustand) — protégé contre XSS
- **Refresh token** : JWT 7 jours en cookie `httpOnly; SameSite=Strict` — protégé contre CSRF
- **Rotation** : à chaque refresh, le refresh token est tourné (invalidation de l'ancien)
- **Middleware** : Next.js edge middleware protège `/app/*` et redirige les utilisateurs connectés hors des pages auth

## Build

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```
