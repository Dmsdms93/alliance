"use client";

import { useState, useCallback } from "react";
import { mockProfiles, type MockProfile } from "@/lib/mock/profiles";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { useToast } from "@/components/auth/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * Feed de découverte — composant client interactif.
 * Affiche les profils un par un avec boutons Passer (croix rouge) et Match (cœur vert).
 * Sauvegarde chaque swipe dans la table `swipes` de Supabase.
 * Détecte les matchs (like réciproque) et propose d'ouvrir le chat.
 *
 * Note : actuellement utilise des mock data. En production, les profils viendront
 * de Supabase (table profiles) et les IDs seront des UUIDs valides.
 */

export function FeedClient({ userName }: { userName: string }) {
  const { addToast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [matchNotification, setMatchNotification] = useState<MockProfile | null>(null);
  const [newMatchId, setNewMatchId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentProfile: MockProfile | null =
    currentIndex < mockProfiles.length ? mockProfiles[currentIndex] : null;

  // --- Sauvegarde un swipe dans Supabase ---
  const saveSwipe = useCallback(
    async (profileId: string, isLike: boolean): Promise<string | null> => {
      try {
        const { data, error } = await supabase
          .from("swipes")
          .insert({
            swiped_id: profileId,
            is_like: isLike,
          })
          .select()
          .single();

        if (error) return null;

        // Si c'est un like, vérifie si un match a été créé par le trigger
        if (isLike && data) {
          await new Promise((resolve) => setTimeout(resolve, 300));

          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: matchData } = await supabase
              .from("matches")
              .select("id")
              .or(
                `and(user1_id.eq.${userData.user.id},user2_id.eq.${profileId}),` +
                `and(user2_id.eq.${userData.user.id},user1_id.eq.${profileId})`
              )
              .maybeSingle();

            if (matchData) return matchData.id;
          }
        }
      } catch (error) {
        console.error("[feed] Erreur swipe:", error);
      }
      return null;
    },
    [supabase]
  );

  // --- Action: Passer ---
  const handlePass = useCallback(async () => {
    if (!currentProfile || exitDirection || isProcessing) return;
    setIsProcessing(true);
    setExitDirection("left");

    // Sauvegarde le swipe (silencieux en cas d'erreur — mock data)
    await saveSwipe(currentProfile.id, false);

    setTimeout(() => {
      setExitDirection(null);
      setCurrentIndex((prev) => prev + 1);
      setIsProcessing(false);
    }, 300);
  }, [currentProfile, exitDirection, isProcessing, saveSwipe]);

  // --- Action: Match (aimer) ---
  const handleMatch = useCallback(async () => {
    if (!currentProfile || exitDirection || isProcessing) return;
    setIsProcessing(true);
    setExitDirection("right");

    // Sauvegarde le swipe + vérifie le match
    const matchId = await saveSwipe(currentProfile.id, true);

    if (matchId) {
      // Match réel détecté (trigger Supabase a créé le match)
      setMatchNotification(currentProfile);
      setNewMatchId(matchId);
    } else {
      // En mode mock data : simulation aléatoire pour la démo
      if (Math.random() > 0.7) {
        setMatchNotification(currentProfile);
        setNewMatchId(null);
      } else {
        addToast(`Vous avez aimé ${currentProfile.firstName} 💚`, "success");
      }
    }

    setTimeout(() => {
      setExitDirection(null);
      setCurrentIndex((prev) => prev + 1);
      setIsProcessing(false);
    }, 300);
  }, [currentProfile, exitDirection, isProcessing, saveSwipe, addToast]);

  // --- État: tous les profils vus ---
  if (!currentProfile && !matchNotification) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-alliance-50">
          <svg className="h-10 w-10 text-alliance-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          C&apos;est tout pour le moment !
        </h3>
        <p className="text-sm text-gray-500">
          Vous avez vu tous les profils disponibles. Revenez plus tard pour de nouvelles personnes.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-2 rounded-xl bg-alliance-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600"
        >
          Recommencer
        </button>
      </div>
    );
  }

  // --- Notification de match ---
  if (matchNotification) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="animate-fade-in rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-4 flex justify-center gap-3">
            <span className="text-4xl">🎉</span>
            <span className="text-3xl font-bold text-green-500">Match !</span>
            <span className="text-4xl">💚</span>
          </div>
          <p className="mb-6 text-lg font-medium text-gray-700">
            Vous avez matché avec{" "}
            <span className="font-bold text-alliance-600">
              {matchNotification.firstName}
            </span>
          </p>
          {matchNotification.photoUrl && (
            <img
              src={matchNotification.photoUrl}
              alt={matchNotification.firstName}
              className="mx-auto mb-6 h-28 w-28 rounded-full object-cover ring-4 ring-green-200 shadow-lg"
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setMatchNotification(null);
                setNewMatchId(null);
              }}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Continuer à découvrir
            </button>
            {newMatchId ? (
              <Link
                href={`/messages/${newMatchId}`}
                className="flex-1 rounded-xl bg-alliance-500 py-3 text-sm font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600"
              >
                Envoyer un message
              </Link>
            ) : (
              <Link
                href="/messages"
                className="flex-1 rounded-xl bg-alliance-500 py-3 text-sm font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600"
              >
                Voir mes messages
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Feed principal ---
  // Guard explicite pour satisfaire TypeScript (currentProfile est non-null ici)
  if (!currentProfile) return null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 px-4 pt-4">
        <div className="mx-auto h-full max-w-md">
          <ProfileCard
            profile={currentProfile}
            isExiting={exitDirection}
          />

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {mockProfiles.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-6 bg-alliance-500"
                    : index < currentIndex
                    ? "w-1.5 bg-alliance-300"
                    : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-center gap-6 px-4 pb-4 pt-2">
        {/* Passer */}
        <button
          onClick={handlePass}
          disabled={!!exitDirection || isProcessing}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-white text-red-500 shadow-lg transition-all hover:scale-110 hover:border-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          aria-label="Passer ce profil"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-gray-400">
            {mockProfiles.length - currentIndex - 1} restant{mockProfiles.length - currentIndex - 1 > 1 ? "s" : ""}
          </span>
        </div>

        {/* Match */}
        <button
          onClick={handleMatch}
          disabled={!!exitDirection || isProcessing}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-500 shadow-lg transition-all hover:scale-110 hover:border-green-400 hover:bg-green-50 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          aria-label="Aimer ce profil"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
