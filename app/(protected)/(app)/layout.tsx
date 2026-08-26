import { BottomNav } from "@/components/dashboard/BottomNav";

/**
 * Layout des pages d'application (dashboard, messages, profile).
 * Inclut la Bottom Nav fixe en bas.
 * L'onboarding n'utilise PAS ce layout (pas de bottom nav pendant la création du profil).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
