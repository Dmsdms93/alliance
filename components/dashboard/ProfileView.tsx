"use client";

import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/auth/Toast";
import { config } from "@/lib/config";
import { useRouter } from "next/navigation";

/**
 * Vue du profil utilisateur — composant client pour la déconnexion.
 * Affiche photo, prénom, âge, genre, préférences et email.
 */

interface ProfileData {
  id: string;
  first_name: string;
  age: number;
  gender: string;
  looking_for: string;
  bio: string | null;
  photo_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export function ProfileView({
  profile,
  email,
}: {
  profile: ProfileData;
  email: string;
}) {
  const { signOut } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    addToast("Vous êtes déconnecté.", "info");
    router.push(config.routes.home);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <h1 className="text-lg font-bold text-gray-900">Mon Profil</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md px-4 py-6">
        {/* Carte profil */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Photo + nom */}
          <div className="flex flex-col items-center gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.first_name}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-alliance-100 shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-alliance-100 text-3xl font-bold text-alliance-500">
                {profile.first_name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.first_name}, {profile.age}
              </h2>
              <p className="text-sm text-gray-500">
                {profile.gender === "homme" ? "Homme" : "Femme"}
                {" · "}
                Cherche:{" "}
                {profile.looking_for === "les deux"
                  ? "Les deux"
                  : profile.looking_for === "homme"
                  ? "Un homme"
                  : "Une femme"}
              </p>
            </div>

            {/* Badge vérification */}
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
              {profile.is_verified ? (
                <>
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-green-600">Profil vérifié</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Profil non vérifié</span>
                </>
              )}
            </div>
          </div>

          {/* Détails */}
          <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Email</p>
              <p className="mt-1 text-sm text-gray-700">{email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Bio</p>
              <p className="mt-1 text-sm text-gray-700">
                {profile.bio || "Aucune bio pour le moment."}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Membre depuis</p>
              <p className="mt-1 text-sm text-gray-700">
                {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            onClick={() => addToast("Édition du profil bientôt disponible.", "info")}
          >
            Modifier mon profil
          </button>
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
