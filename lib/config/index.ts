/**
 * Configuration centralisée d'Alliance.
 * Toutes les constantes et URLs du projet dans un seul endroit.
 */

export const config = {
  appName: "Alliance",
  appTagline: "La confiance avant tout",
  appDescription:
    "Alliance — la plateforme de rencontre basée sur la confiance, pensée pour la Côte d'Ivoire.",

  // URLs publiques
  routes: {
    home: "/",
    auth: "/auth",
    onboarding: "/onboarding",
    dashboard: "/dashboard",
    messages: "/messages",
    profile: "/profile",
  },

  // Configuration Cloudflare R2 (stockage photos)
  r2: {
    publicUrl: process.env.R2_PUBLIC_URL ?? "",
    bucketName: process.env.R2_BUCKET_NAME ?? "alliance-photos",
  },

  // Configuration WebSocket (chat temps réel — Oracle Cloud)
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL ?? "",
  },

  // Limites
  limits: {
    maxPhotoSize: 5 * 1024 * 1024, // 5MB
    maxBioLength: 500,
    minAge: 18,
    maxAge: 99,
  },
} as const;
