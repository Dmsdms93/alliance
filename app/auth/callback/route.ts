import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { config } from "@/lib/config";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Callback OAuth pour Google.
 * Next.js Route Handler qui échange le code contre une session Supabase,
 * puis redirige vers onboarding (premier login) ou dashboard (profil complet).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? config.routes.onboarding;

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Échange le code OAuth contre une session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Vérifie si l'utilisateur a complété son onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        const redirectTo = profile?.onboarding_completed
          ? config.routes.dashboard
          : config.routes.onboarding;
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      return supabaseResponse;
    }
  }

  // En cas d'erreur, retour vers la page d'auth
  return NextResponse.redirect(`${origin}${config.routes.auth}?error=oauth_failed`);
}
