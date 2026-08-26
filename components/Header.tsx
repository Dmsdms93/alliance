"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Header global d'Alliance.
 * Logo texte "Alliance" + navigation contextuelle (login/register si déconnecté, dashboard si connecté).
 * Mobile-first : minimal, sticky, fond flou.
 * Masqué sur les routes protégées et la page d'auth (elles ont leur propre layout plein écran).
 */
export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Masquer le header sur les routes plein écran (auth + routes protégées)
  const hiddenRoutes = [
    config.routes.auth,
    config.routes.dashboard,
    config.routes.onboarding,
    config.routes.messages,
    config.routes.profile,
  ];
  const isHidden = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (isHidden) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo texte */}
        <Link href={config.routes.home} className="flex items-center gap-1">
          <span className="text-2xl font-bold tracking-tight text-alliance-600">
            Alliance
          </span>
          <span className="hidden text-sm font-normal text-trust-400 sm:inline">
            · confiance
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link
                href={config.routes.dashboard}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-alliance-50 hover:text-alliance-600",
                  pathname === config.routes.dashboard && "bg-alliance-50 text-alliance-600"
                )}
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href={config.routes.auth}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Connexion
              </Link>
              <Link
                href={`${config.routes.auth}?mode=signup`}
                className="rounded-lg bg-alliance-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-alliance-600 hover:shadow-md"
              >
                Rejoindre
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
