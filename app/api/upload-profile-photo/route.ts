import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, getR2PublicUrl, generatePhotoKey, validateR2Config } from "@/lib/r2/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { cookies } from "next/headers";

/**
 * API Route : Upload d'une photo de profil vers Cloudflare R2.
 *
 * POST /api/upload-profile-photo
 * Content-Type: multipart/form-data
 * Body: { photo: File } — image JPG, PNG ou WebP (max 5MB)
 *
 * Flux :
 * 1. Vérifie l'auth Supabase (session cookie)
 * 2. Valide la configuration R2 (variables d'env)
 * 3. Valide le fichier (type MIME + taille)
 * 4. Upload vers R2 avec clé unique (profiles/<userId>/<timestamp>.<ext>)
 * 5. Retourne l'URL publique de l'image
 *
 * Réponses :
 * - 200: { url: string } — URL publique de la photo uploadée
 * - 401: { error: string } — Non authentifié
 * - 400: { error: string } — Fichier invalide (type/taille)
 * - 500: { error: string } — Erreur R2 ou serveur
 *
 * Sécurité :
 * - Le user doit être authentifié (session Supabase valide)
 * - Les credentials R2 restent côté serveur (jamais dans le bundle client)
 * - L'upload se fait via cette API route, pas directement depuis le navigateur
 */

// --- Configuration de la route ---
export const runtime = "nodejs"; // Requis pour @aws-sdk/client-s3 (pas compatible edge)
export const maxDuration = 30; // 30 secondes max (Cloudflare Pages limite)

// --- Types MIME autorisés ---
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    // ========================================
    //  1. VÉRIFICATION DE L'AUTHENTIFICATION
    // ========================================
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié. Vous devez être connecté pour uploader une photo." },
        { status: 401 }
      );
    }

    // ========================================
    //  2. VÉRIFICATION DE LA CONFIG R2
    // ========================================
    const r2Config = validateR2Config();
    if (!r2Config.valid) {
      console.error("[upload] Configuration R2 incomplète:", r2Config.missing);
      return NextResponse.json(
        {
          error: "Stockage non configuré. Variables manquantes: " + r2Config.missing.join(", "),
        },
        { status: 503 }
      );
    }

    // ========================================
    //  3. RÉCUPÉRATION ET VALIDATION DU FICHIER
    // ========================================
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni. Ajoutez un champ 'photo'." },
        { status: 400 }
      );
    }

    // Vérifie le type MIME
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          error: `Format "${file.type}" non supporté. Utilisez JPG, PNG ou WebP.`,
        },
        { status: 400 }
      );
    }

    // Vérifie la taille (max 5MB)
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide." },
        { status: 400 }
      );
    }

    if (file.size > config.limits.maxPhotoSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `La photo fait ${sizeMB}MB. Maximum: 5MB.` },
        { status: 400 }
      );
    }

    // ========================================
    //  4. UPLOAD VERS CLOUDFLARE R2
    // ========================================
    const ext = ALLOWED_TYPES[file.type]; // "image/jpeg" → "jpg"
    const key = generatePhotoKey(user.id, ext);

    const r2 = createR2Client();
    const bytes = await file.arrayBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: new Uint8Array(bytes),
        ContentType: file.type,
        CacheControl: "public, max-age=31536000", // Cache navigateur 1 an
        Metadata: {
          "user-id": user.id,
          "uploaded-at": new Date().toISOString(),
        },
      })
    );

    // ========================================
    //  5. RÉPONSE — URL PUBLIQUE
    // ========================================
    const publicUrl = getR2PublicUrl(key);

    return NextResponse.json(
      { url: publicUrl, key },
      { status: 200 }
    );
  } catch (error) {
    console.error("[upload-profile-photo] Erreur:", error);

    // Erreur de configuration R2 (variables manquantes)
    if (error instanceof Error && error.message.includes("Configuration R2")) {
      return NextResponse.json(
        { error: "Erreur de configuration du stockage. Vérifiez vos variables R2 dans .env.local." },
        { status: 503 }
      );
    }

    // Erreur réseau R2 (bucket inexistant, credentials invalides)
    if (error instanceof Error && (error.message.includes("NoSuchBucket") || error.message.includes("AccessDenied"))) {
      return NextResponse.json(
        { error: "Bucket R2 inaccessible. Vérifiez le nom du bucket et les credentials." },
        { status: 502 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      { error: "Erreur lors de l'upload de la photo. Réessayez." },
      { status: 500 }
    );
  }
}
