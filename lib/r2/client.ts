import { S3Client } from "@aws-sdk/client-s3";

/**
 * Client Cloudflare R2 (compatible API S3).
 * Côté serveur uniquement — les credentials ne sont JAMAIS exposés au client.
 *
 * Architecture 0€ :
 * - R2 : pas de frais de stockage (10GB gratuits)
 * - R2 : pas de frais de bande passante (transfert gratuit, contrairement à S3)
 * - R2 : pas de frais de requêtes (Class A operations, 1M/mois gratuits)
 *
 * Endpoint R2 : https://<account-id>.r2.cloudflarestorage.com
 */

/**
 * Vérifie que toutes les variables R2 sont configurées.
 * Lance une erreur descriptive si une variable manque.
 * Appelée avant chaque opération R2 pour un diagnostic clair.
 */
export function validateR2Config(): { valid: boolean; missing: string[] } {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  return { valid: missing.length === 0, missing };
}

/**
 * Crée le client S3 configuré pour Cloudflare R2.
 * R2 est 100% compatible avec l'API S3, donc @aws-sdk/client-s3 fonctionne nativement.
 */
export function createR2Client(): S3Client {
  const { valid, missing } = validateR2Config();

  if (!valid) {
    throw new Error(
      `Configuration R2 incomplète. Variables manquantes: ${missing.join(", ")}. ` +
        `Ajoutez-les dans .env.local — voir le README pour le guide.`
    );
  }

  return new S3Client({
    region: "auto", // R2 ignore ce champ mais le SDK exige une valeur
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Génère l'URL publique d'un objet stocké dans R2.
 *
 * Deux options pour l'URL publique :
 * 1. Domaine personnalisé (recommandé) : https://cdn.alliance.ci
 * 2. Sous-domaine R2 ( automatique) : https://pub-xxx.r2.dev
 *
 * Configuré dans : Dashboard Cloudflare → R2 → Bucket → Settings → Public access
 */
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL manquant dans .env.local");
  }

  // Évite le double slash si l'URL se termine par /
  const base = publicUrl.replace(/\/$/, "");
  return `${base}/${key}`;
}

/**
 * Génère une clé unique pour une photo de profil.
 * Format: profiles/<user-id>/<timestamp>.<extension>
 *
 * Cette structure permet :
 * - L'isolation par utilisateur (un dossier par user)
 * - L'unicité via le timestamp
 * - Le nettoyage facile (supprimer tout un dossier utilisateur)
 */
export function generatePhotoKey(userId: string, extension: string): string {
  const timestamp = Date.now();
  const safeExt = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `profiles/${userId}/${timestamp}.${safeExt}`;
}
