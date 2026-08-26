import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { config } from "@/lib/config";

/**
 * API Route : Finalisation du profil utilisateur post-onboarding.
 *
 * POST /api/create-profile
 * Body: { firstName, age, gender, lookingFor, photoUrl }
 *
 * Le trigger Supabase crée déjà un profil vide à l'inscription.
 * Cette route fait un UPDATE (pas INSERT) pour remplir les données
 * et marque onboarding_completed = true.
 *
 * Étapes :
 * 1. Vérifie l'auth Supabase
 * 2. Valide les données
 * 3. UPDATE la table profiles + onboarding_completed = true
 * 4. Déclenche un webhook post-inscription (configurable)
 */

interface CreateProfileBody {
  firstName: string;
  age: number;
  gender: "homme" | "femme";
  lookingFor: "homme" | "femme" | "les deux";
  photoUrl: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Auth ---
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // --- 2. Validation ---
    const body: CreateProfileBody = await request.json();

    if (!body.firstName || body.firstName.trim().length < 2) {
      return NextResponse.json(
        { error: "Prénom invalide (minimum 2 caractères)." },
        { status: 400 }
      );
    }

    if (body.age < config.limits.minAge || body.age > config.limits.maxAge) {
      return NextResponse.json(
        { error: `Âge invalide (${config.limits.minAge}-${config.limits.maxAge}).` },
        { status: 400 }
      );
    }

    if (!["homme", "femme"].includes(body.gender)) {
      return NextResponse.json({ error: "Genre invalide." }, { status: 400 });
    }

    if (!["homme", "femme", "les deux"].includes(body.lookingFor)) {
      return NextResponse.json({ error: "Préférence invalide." }, { status: 400 });
    }

    // --- 3. UPDATE du profil (le trigger a déjà créé la ligne) ---
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: body.firstName.trim(),
        age: body.age,
        gender: body.gender,
        looking_for: body.lookingFor,
        photo_url: body.photoUrl,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[create-profile] Erreur Supabase:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du profil." },
        { status: 500 }
      );
    }

    // --- 4. Webhook post-inscription ---
    const webhookUrl = process.env.POST_REGISTRATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "profile.completed",
            userId: user.id,
            email: user.email,
            firstName: body.firstName,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error("[create-profile] Webhook échoué:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profil créé avec succès.",
    });
  } catch (error) {
    console.error("[create-profile] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}
