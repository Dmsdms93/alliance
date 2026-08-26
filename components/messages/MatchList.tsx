"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Liste des matchs pour la page /messages.
 * Récupère les matchs de l'utilisateur et les affiche avec le nom
 * et la photo de l'autre personne.
 * Cliquer sur un match → /messages/[matchId] (chat temps réel).
 */

interface MatchRow {
  match_id: string;
  created_at: string;
  partner_id: string;
  partner_first_name: string;
  partner_photo_url: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export function MatchList({ currentUserId }: { currentUserId: string }) {
  const supabase = createSupabaseBrowserClient();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchMatches = async () => {
      // Récupère tous les matchs de l'utilisateur
      const { data: matchRows } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, created_at")
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (!mounted || !matchRows || matchRows.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      // Pour chaque match, récupère l'info du partenaire + dernier message
      const enriched: MatchRow[] = [];

      for (const match of matchRows) {
        const partnerId = match.user1_id === currentUserId ? match.user2_id : match.user1_id;

        const { data: partner } = await supabase
          .from("profiles")
          .select("first_name, photo_url")
          .eq("id", partnerId)
          .maybeSingle();

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", match.id)
          .neq("sender_id", currentUserId)
          .is("read_at", null);

        enriched.push({
          match_id: match.id,
          created_at: match.created_at,
          partner_id: partnerId,
          partner_first_name: partner?.first_name ?? "Utilisateur",
          partner_photo_url: partner?.photo_url ?? null,
          last_message_content: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
          unread_count: count ?? 0,
        });
      }

      // Trie par dernier message (ou date de match si pas de message)
      enriched.sort((a, b) => {
        const dateA = new Date(a.last_message_at ?? a.created_at).getTime();
        const dateB = new Date(b.last_message_at ?? b.created_at).getTime();
        return dateB - dateA;
      });

      if (mounted) {
        setMatches(enriched);
        setIsLoading(false);
      }
    };

    fetchMatches();

    // --- Realtime : écoute les nouveaux messages pour mettre à jour la liste ---
    const channel = supabase
      .channel("match-list-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchMatches()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  // --- États ---
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-alliance-500 border-t-transparent" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-trust-50">
          <svg className="h-10 w-10 text-trust-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Aucun match pour le moment</h3>
        <p className="text-sm text-gray-500">
          Continuez à découvrir des profils dans l'onglet Découvrir.
          Quand vous aurez un match, vos conversations apparaîtront ici.
        </p>
      </div>
    );
  }

  // --- Liste des matchs ---
  return (
    <div className="flex-1 overflow-y-auto">
      {matches.map((match) => (
        <Link
          key={match.match_id}
          href={`/messages/${match.match_id}`}
          className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          {/* Avatar */}
          {match.partner_photo_url ? (
            <img
              src={match.partner_photo_url}
              alt={match.partner_first_name}
              className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-alliance-100 text-lg font-bold text-alliance-500">
              {match.partner_first_name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Infos */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{match.partner_first_name}</h3>
              {match.last_message_at && (
                <span className="text-xs text-gray-400">
                  {formatTime(match.last_message_at)}
                </span>
              )}
            </div>
            <p className="truncate text-sm text-gray-500">
              {match.last_message_content || "Nouveau match — dites bonjour ! 👋"}
            </p>
          </div>

          {/* Badge non lus */}
          {match.unread_count > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-alliance-500 px-1.5 text-xs font-bold text-white">
              {match.unread_count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
