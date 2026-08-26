/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatible — standalone output
  output: "standalone",
  images: {
    // Cloudflare R2 + autres domaines d'images autorisés
    remotePatterns: [
      // R2 sous-domaine public (r2.dev)
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      // R2 domaine personnalisé (ex: cdn.alliance.ci)
      {
        protocol: "https",
        hostname: "*.alliance.ci",
      },
      // Photos Google (avatars OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Mock data (Unsplash)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Middleware actif pour le refresh de session Supabase
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // pour l'upload de photos de profil
    },
  },
};

export default nextConfig;
