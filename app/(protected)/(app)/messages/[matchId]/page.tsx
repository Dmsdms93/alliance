import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { ChatClient } from "@/components/messages/ChatClient";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Page Chat — /messages/[matchId]
 * Affiche la conversation temps réel avec un match.
 *
 * Sécurité serveur :
 * 1. Vérifie l'auth Supabase
 * 2. Vérifie que le match appartient à l'utilisateur
 * 3. Récupère les infos du partenaire (nom, photo)
 * 4. Passe tout au composant client ChatClient (Supabase Realtime)
 *
 * Si le match n'existe pas ou n'appartient pas à l'utilisateur → 404
 */
export default async function ChatPage({
  params,
}: {
  params: { matchId: string };
}) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // --- 1. Auth ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.routes.auth);
  }

  // --- 2. Vérifie onboarding ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect(config.routes.onboarding);
  }

  // --- 3. Vérifie que le match appartient à l'utilisateur ---
  const { data: match } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id")
    .eq("id", params.matchId)
    .maybeSingle();

  if (!match) {
    notFound();
  }

  // Vérifie que l'utilisateur fait partie du match
  const isParticipant = match.user1_id === user.id || match.user2_id === user.id;
  if (!isParticipant) {
    notFound();
  }

  // --- 4. Récupère les infos du partenaire ---
  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

  const { data: partner } = await supabase
    .from("profiles")
    .select("first_name, photo_url")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) {
    notFound();
  }

  // --- 5. Marque les messages reçus comme lus ---
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", params.matchId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  // --- 6. Rend le chat ---
  return (
    <ChatClient
      matchId={params.matchId}
      currentUserId={user.id}
      partnerName={partner.first_name ?? "Utilisateur"}
      partnerPhotoUrl={partner.photo_url}
    />
  );
}
