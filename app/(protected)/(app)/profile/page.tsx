import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { ProfileView } from "@/components/dashboard/ProfileView";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page Mon Profil — affiche le profil de l'utilisateur.
 * Sécurité serveur : vérifie session + onboarding_completed.
 */
export default async function ProfilePage() {
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
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed) {
    redirect(config.routes.onboarding);
  }

  return <ProfileView profile={profile} email={user.email ?? ""} />;
}
