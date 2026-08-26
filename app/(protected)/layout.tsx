import { ProtectedRoute } from "@/components/ProtectedRoute";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Layout des routes protégées.
 * Enveloppe toutes les pages /dashboard, /onboarding, /messages, /profile
 * dans le composant de sécurité côté client.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
