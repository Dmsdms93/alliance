"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/auth/Toast";
import { translateAuthError } from "@/lib/auth/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

/**
 * Formulaire Email/Mot de passe.
 * Gère connexion ET inscription selon le mode actif.
 * Validation côté client + gestion d'erreurs traduites.
 */
export function EmailAuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation côté client ---
    if (!email || !password) {
      addToast("Veuillez remplir tous les champs.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast("Adresse email invalide.", "error");
      return;
    }

    if (password.length < 6) {
      addToast("Le mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        addToast("Compte créé ! Vérifiez votre email pour confirmer.", "success");

        // Si la confirmation email est désactivée dans Supabase, l'utilisateur est connecté
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Le trigger a créé un profil vide, on va à l'onboarding
          router.push(config.routes.onboarding);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirection stricte : onboarding si pas complété, dashboard sinon
        const redirectTo = searchParams.get("redirect");
        await redirectAfterAuth(redirectTo, supabase, router, addToast);
      }
    } catch (error) {
      const translated = translateAuthError(error);
      addToast(translated.message, translated.type);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          autoComplete="email"
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20 disabled:opacity-50"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20 disabled:opacity-50"
        />
        {mode === "signup" && (
          <p className="mt-1 text-xs text-gray-500">
            Minimum 6 caractères.
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-alliance-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connexion…
          </span>
        ) : mode === "signup" ? (
          "Créer mon compte"
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
  );
}

/**
 * Logique de redirection après authentification réussie.
 * Vérifie onboarding_completed → onboarding ou dashboard.
 * Le trigger Supabase crée toujours un profil (vide) à l'inscription,
 * donc on vérifie le champ onboarding_completed et non l'existence de la ligne.
 */
export async function redirectAfterAuth(
  redirectParam: string | null,
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  router: ReturnType<typeof useRouter>,
  addToast: (msg: string, type?: "error" | "success" | "info") => void
) {
  // Si on a un param de redirect explicite (venant du middleware), on l'utilise
  if (redirectParam && redirectParam.startsWith("/")) {
    addToast("Connexion réussie !", "success");
    router.push(redirectParam);
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      addToast("Connexion réussie !", "success");
      router.push(config.routes.onboarding);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    addToast("Connexion réussie !", "success");

    if (profile?.onboarding_completed) {
      router.push(config.routes.dashboard);
    } else {
      router.push(config.routes.onboarding);
    }
  } catch {
    router.push(config.routes.onboarding);
  }
}
