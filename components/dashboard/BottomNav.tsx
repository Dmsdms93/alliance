"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Barre de navigation inférieure (Bottom Nav).
 * Mobile-first : fixe en bas, 3 onglets — Découvrir, Messages, Mon Profil.
 * Masquée sur l'onboarding (l'utilisateur n'a pas encore de profil).
 */

const navItems = [
  {
    label: "Découvrir",
    href: "/dashboard",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 0z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/profile",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 transition-colors",
                isActive
                  ? "text-alliance-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {item.icon(isActive)}
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-px h-0.5 w-8 rounded-full bg-alliance-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
