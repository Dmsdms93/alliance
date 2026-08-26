import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { MatchList } from "@/components/messages/MatchList";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page Messages — liste des matchs.
 * Récupère l'userId côté serveur pour le passer au composant client.
 * Le composant MatchList utilise Supabase Realtime pour les mises à jour.
 */
export default async function MessagesPage() {
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
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
          <p className="text-xs text-gray-400">Vos conversations avec vos matchs</p>
        </div>
      </header>

      <MatchList currentUserId={user.id} />
    </div>
  );
}
