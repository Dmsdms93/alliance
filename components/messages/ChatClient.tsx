"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Chat temps réel — composant client.
 * Utilise Supabase Realtime (postgres_changes) pour écouter les nouveaux
 * messages et les afficher instantanément sans recharger la page.
 *
 * Architecture 100% serverless :
 * - Les messages sont stockés dans la table `messages` (PostgreSQL)
 * - Supabase Realtime diffuse les changements via WebSocket automatique
 * - Pas de serveur WebSocket custom à maintenir
 * - L'abonnement se fait côté client via supabase.channel()
 *
 * Note : utilise flex-1 (pas h-screen) pour s'intégrer dans le layout (app)
 * qui inclut la BottomNav.
 */

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface ChatClientProps {
  matchId: string;
  currentUserId: string;
  partnerName: string;
  partnerPhotoUrl: string | null;
}

export function ChatClient({
  matchId,
  currentUserId,
  partnerName,
  partnerPhotoUrl,
}: ChatClientProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ========================================
  //  1. CHARGER L'HISTORIQUE DES MESSAGES
  // ========================================
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (mounted && !error && data) {
        setMessages(data as Message[]);
        setIsLoading(false);
      }
    };

    loadMessages();

    return () => { mounted = false; };
  }, [matchId, supabase]);

  // ========================================
  //  2. SUPABASE REALTIME — ÉCOUTE DES NOUVEAUX MESSAGES
  // ========================================
  useEffect(() => {
    let mounted = true;

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (!mounted) return;
          const newMessage = payload.new as Message;

          // Évite les doublons (si le message est déjà dans la liste)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // Marque comme lu si le message vient du partenaire
          if (newMessage.sender_id !== currentUserId && !newMessage.read_at) {
            markAsRead(newMessage.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (!mounted) return;
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPartnerOnline(Object.keys(state).length > 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, currentUserId, supabase]);

  // ========================================
  //  3. MARQUER COMME LU
  // ========================================
  const markAsRead = useCallback(
    async (messageId: string) => {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);
    },
    [supabase]
  );

  // ========================================
  //  4. SCROLL AUTO VERS LE DERNIER MESSAGE
  // ========================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ========================================
  //  5. ENVOYER UN MESSAGE
  // ========================================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInput("");

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajout immédiat (optimistic update + Realtime confirmera)
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as Message];
        });
      }
    } catch (error) {
      console.error("[chat] Erreur envoi:", error);
      setInput(content); // Restore le message dans l'input
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // ========================================
  //  RENDU
  // ========================================
  return (
    <div className="flex flex-1 flex-col bg-gray-50">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.push("/messages")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Retour"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {partnerPhotoUrl ? (
          <img
            src={partnerPhotoUrl}
            alt={partnerName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alliance-100 font-bold text-alliance-500">
            {partnerName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">{partnerName}</h1>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            {partnerOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500" />
                En ligne
              </>
            ) : (
              "Hors ligne"
            )}
          </p>
        </div>
      </header>

      {/* --- MESSAGES --- */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-alliance-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-alliance-50">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-gray-500">
              Démarrez la conversation avec {partnerName}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-2">
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === currentUserId;
              const showTime =
                index === 0 ||
                new Date(messages[index - 1].created_at).getTime() +
                  5 * 60 * 1000 <
                  new Date(msg.created_at).getTime();

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="my-3 text-center text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-alliance-500 text-white"
                          : "rounded-bl-md bg-white text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {isMine && (
                        <span className="mt-1 block text-right text-xs text-white/60">
                          {msg.read_at ? "Vu" : "Envoyé"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* --- INPUT --- */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message à ${partnerName}...`}
            maxLength={2000}
            autoComplete="off"
            autoFocus
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-alliance-500 text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 disabled:opacity-40 disabled:shadow-none"
            aria-label="Envoyer"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
