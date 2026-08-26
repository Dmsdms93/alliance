import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { FeedClient } from "@/components/dashboard/FeedClient";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page Dashboard — l'espace privé principal.
 * Affiche un message d'accueil personnalisé ("Bonjour [Prénom]") et le feed de découverte.
 * Sécurité serveur : vérifie session + onboarding_completed.
 */
export default async function DashboardPage() {
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
    .select("id, first_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed) {
    redirect(config.routes.onboarding);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Bonjour 👋</p>
            <h1 className="text-lg font-bold text-gray-900">
              {profile.first_name}
            </h1>
          </div>
          <span className="text-2xl font-bold text-alliance-600">Alliance</span>
        </div>
      </header>

      <FeedClient userName={profile.first_name} />
    </div>
  );
}
