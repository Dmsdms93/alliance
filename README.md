# Alliance — Application de Rencontre par la Confiance

Plateforme de rencontre mobile-first, pensée pour la Côte d'Ivoire.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend & Hébergement | Next.js 14 + Cloudflare Pages |
| Base de données & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Stockage photos | Cloudflare R2 (compatible S3, via @aws-sdk/client-s3) |
| Chat temps réel | Node.js + WebSockets (Oracle Cloud) |

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et remplir les variables d'environnement
cp .env.local.example .env.local

# 3. Lancer en développement
npm run dev

# 4. Ouvrir http://localhost:3000
```

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans **Authentication → Providers**, activez :
   - Email (déjà activé par défaut)
   - Google (ajoutez votre Client ID / Secret Google Cloud)
   - Phone (ajoutez un provider SMS comme Twilio)
3. Dans **Authentication → URL Configuration**, définissez :
   - Site URL : `http://localhost:3000`
   - Redirect URL : `http://localhost:3000/auth/callback`
4. Exécutez le schéma SQL : `supabase/schema.sql` dans SQL Editor
5. Copiez l'URL et la clé anon dans `.env.local`

## Configuration Cloudflare R2

1. Dans le dashboard Cloudflare → **R2 Object Storage**
2. Créez un bucket nommé `alliance-photos`
3. Activez l'accès public (custom domain ou r2.dev subdomain)
4. Créez un **API Token** (R2 → Manage R2 API Tokens)
5. Remplissez dans `.env.local` : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

## Structure du projet

```
alliance/
├── app/
│   ├── (protected)/
│   │   ├── (app)/                # Pages avec Bottom Nav
│   │   │   ├── layout.tsx        # Layout avec BottomNav
│   │   │   ├── dashboard/        # Feed de découverte (Étape 4)
│   │   │   ├── messages/         # Messagerie (placeholder, WebSocket futur)
│   │   │   └── profile/          # Profil utilisateur (Étape 4)
│   │   ├── layout.tsx            # ProtectedRoute wrapper
│   │   └── onboarding/           # Stepper création profil (Étape 3)
│   ├── api/
│   │   ├── create-profile/       # API: création profil + webhook
│   │   └── upload-profile-photo/ # API: upload photo vers R2
│   ├── auth/
│   │   ├── callback/route.ts     # Callback OAuth Google
│   │   └── page.tsx              # Page d'auth centralisée (Étape 2)
│   ├── globals.css               # Styles globaux
│   ├── layout.tsx                # Layout racine (AuthProvider + ToastProvider)
│   └── page.tsx                  # Landing page (Étape 1)
├── components/
│   ├── auth/                     # Auth: Email, Google, Phone, Toast
│   ├── dashboard/                # Dashboard: BottomNav, FeedClient, ProfileCard, ProfileView
│   ├── onboarding/               # Onboarding: Stepper + OnboardingClient
│   ├── AuthProvider.tsx          # Contexte d'auth Supabase
│   ├── Header.tsx                # Header global
│   └── ProtectedRoute.tsx        # Guard de routes privées
├── lib/
│   ├── auth/errors.ts            # Mapping erreurs Supabase → FR
│   ├── config/                   # Configuration centralisée
│   ├── mock/profiles.ts          # Mock data pour le feed
│   ├── r2/client.ts              # Client Cloudflare R2 (S3 compatible)
│   ├── supabase/                 # Clients Supabase (client, server, middleware)
│   └── utils.ts                  # Utilitaires (cn, etc.)
├── supabase/
│   └── schema.sql                # Schéma PostgreSQL
├── middleware.ts                 # Middleware auth Next.js
└── next.config.mjs               # Config Next.js (Cloudflare compatible)
```

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/create-profile` | POST | Crée le profil dans Supabase + déclenche le webhook post-inscription |
| `/api/upload-profile-photo` | POST | Upload une photo vers Cloudflare R2 (multipart/form-data) |
| `/auth/callback` | GET | Callback OAuth Google — échange le code contre une session |

## Parcours utilisateur

```
Landing (/) → Auth (/auth) → Onboarding (/onboarding) → Dashboard (/dashboard)
                                    ↓                        ↓
                             Stepper 4 étapes          Bottom Nav:
                             Prénom, Âge,              Découvrir, Messages, Profil
                             Genre, Photo (R2)
```

## Sécurité (triple couche)

1. **Middleware** (serveur) — Refresh session Supabase + redirection des routes protégées
2. **ProtectedRoute** (client) — Vérifie user + hasProfile, redirect onboarding si incomplet
3. **Pages server-side** — Chaque page protégée vérifie `getUser()` + profil en DB

## Étapes de développement

- ✅ Étape 1 : Architecture de base et Landing Page
- ✅ Étape 2 : Module d'Authentification (Email, Google, Téléphone)
- ✅ Étape 3 : Onboarding (Création du profil avec stepper + upload R2)
- ✅ Étape 4 : Dashboard et Feed de profils (Passer/Match + Bottom Nav)
