import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { AuthClient } from "@/components/auth/AuthClient";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page d'authentification centralisée.
 * Vérifie côté serveur si déjà connecté → redirect dashboard.
 * Sinon, rend le composant client avec les 3 méthodes d'auth.
 */
export default async function AuthPage() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(config.routes.dashboard);
  }

  return <AuthClient />;
}
