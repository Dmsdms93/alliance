"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { config } from "@/lib/config";

/**
 * Composant de protection de routes côté client.
 * Redirige vers /auth si non connecté, vers /onboarding si pas de profil.
 * Le middleware gère déjà la sécurité côté serveur — c'est une double sécurité UI.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, hasProfile } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    if (!user) {
      setHasRedirected(true);
      router.replace(config.routes.auth);
      return;
    }

    // Si l'utilisateur n'a pas de profil et n'est pas déjà sur /onboarding,
    // on le redirige vers l'onboarding
    const currentPath = window.location.pathname;
    if (!hasProfile && currentPath !== config.routes.onboarding) {
      setHasRedirected(true);
      router.replace(config.routes.onboarding);
      return;
    }
  }, [user, isLoading, hasProfile, router, hasRedirected]);

  // Loader plein écran pendant la vérification
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-alliance-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
