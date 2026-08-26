"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useToast } from "@/components/auth/Toast";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

type AuthMethod = "email" | "phone";

/**
 * Composant client principal de la page d'authentification.
 * Gère les 3 méthodes : Email/Password, Google, Téléphone.
 * Onglets pour basculer entre les méthodes.
 * Détecte les erreurs OAuth retournées par le callback (?error=...).
 */

function AuthClientContent() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [method, setMethod] = useState<AuthMethod>("email");

  // Affiche une erreur si le callback OAuth a échoué
  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode === "oauth_failed") {
      addToast("La connexion Google a échoué. Réessayez.", "error");
    }
  }, [searchParams, addToast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-alliance-50 via-white to-trust-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-alliance-600">Alliance</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "signup" ? "Rejoignez la confiance" : "Heureux de vous revoir"}
          </p>
        </div>

        {/* Carte d'auth */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
          {/* Switch Login / Signup */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "login"
                  ? "bg-white text-alliance-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "signup"
                  ? "bg-white text-alliance-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Inscription
            </button>
          </div>

          {/* Google OAuth — toujours visible en premier */}
          <GoogleAuthButton />

          {/* Séparateur */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Onglets Email / Téléphone */}
          <div className="mb-4 flex rounded-xl bg-gray-50 p-1">
            <button
              onClick={() => setMethod("email")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                method === "email"
                  ? "bg-white text-alliance-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                method === "phone"
                  ? "bg-white text-alliance-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Téléphone
            </button>
          </div>

          {/* Formulaire selon la méthode */}
          {method === "email" ? (
            <EmailAuthForm mode={mode} />
          ) : (
            <PhoneAuthForm />
          )}
        </div>

        {/* Lien en bas */}
        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === "signup" ? (
            <>
              Déjà un compte ?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-medium text-alliance-600 hover:text-alliance-700"
              >
                Connectez-vous
              </button>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-medium text-alliance-600 hover:text-alliance-700"
              >
                Créez-en un
              </button>
            </>
          )}
        </p>

        {/* Note de confiance */}
        <p className="mt-4 text-center text-xs text-gray-400">
          🔒 Vos données sont sécurisées par Supabase Auth.
        </p>
      </div>
    </div>
  );
}

/**
 * Wrapper avec Suspense pour useSearchParams.
 * Suspense est requis par Next.js 14 pour les composants utilisant useSearchParams.
 */
export function AuthClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-alliance-500 border-t-transparent" />
        </div>
      }
    >
      <AuthClientContent />
    </Suspense>
  );
}
