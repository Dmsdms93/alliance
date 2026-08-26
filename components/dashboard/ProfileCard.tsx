"use client";

import type { MockProfile } from "@/lib/mock/profiles";
import { cn } from "@/lib/utils";

/**
 * Carte de profil pour le feed de découverte.
 * Affiche la photo, prénom, âge, ville, distance, centres d'intérêt et bio.
 * Animations de sortie : glissement gauche (passer) ou droite (match).
 */

interface ProfileCardProps {
  profile: MockProfile;
  isExiting?: "left" | "right" | null;
  className?: string;
}

export function ProfileCard({ profile, isExiting, className }: ProfileCardProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl transition-transform duration-300 ease-out",
        isExiting === "left" && "-translate-x-[150%] -rotate-12 opacity-0",
        isExiting === "right" && "translate-x-[150%] rotate-12 opacity-0",
        className
      )}
    >
      {/* Photo */}
      <div className="relative h-[65%] w-full overflow-hidden">
        <img
          src={profile.photoUrl}
          alt={profile.firstName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* Dégradé pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badges PASS / MATCH */}
        {isExiting === "left" && (
          <div className="absolute left-6 top-6 -rotate-12 rounded-xl border-4 border-red-500 px-4 py-2 text-2xl font-black text-red-500">
            PASSER
          </div>
        )}
        {isExiting === "right" && (
          <div className="absolute right-6 top-6 rotate-12 rounded-xl border-4 border-green-500 px-4 py-2 text-2xl font-black text-green-500">
            MATCH
          </div>
        )}

        {/* Infos sur la photo */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold drop-shadow-lg">
                {profile.firstName}, {profile.age}
              </h2>
              <p className="flex items-center gap-1 text-sm text-white/90 drop-shadow">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.city} · à {profile.distance} km
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section détails */}
      <div className="flex h-[35%] flex-col p-4">
        {/* Centres d'intérêt */}
        <div className="mb-3 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-trust-50 px-3 py-1 text-xs font-medium text-trust-600"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Bio */}
        <p className="flex-1 overflow-y-auto text-sm leading-relaxed text-gray-600">
          {profile.bio}
        </p>
      </div>
    </div>
  );
}
