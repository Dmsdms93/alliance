import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page Onboarding (Étape 3).
 * Le trigger Supabase crée déjà un profil vide à l'inscription.
 * Si onboarding_completed = true → redirect dashboard.
 * Sinon → affiche le stepper pour compléter le profil.
 */
export default async function OnboardingPage() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.routes.auth);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect(config.routes.dashboard);
  }

  return <OnboardingClient userId={user.id} />;
}
