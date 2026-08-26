"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/auth/Toast";
import { translateAuthError, type AuthError } from "@/lib/auth/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { redirectAfterAuth } from "@/components/auth/EmailAuthForm";

/**
 * Authentification par numéro de téléphone (OTP SMS).
 * Flux en 2 étapes :
 * 1. Saisie du numéro → envoi du code SMS
 * 2. Saisie du code à 6 chiffres → vérification
 */
export function PhoneAuthForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { addToast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Valide le format du numéro ivoirien
  const formatPhone = (raw: string): string => {
    // Supprime les espaces, garde le + initial
    let cleaned = raw.replace(/\s/g, "");
    // Si commence par 0, remplace par +225
    if (cleaned.startsWith("0")) {
      cleaned = "+225" + cleaned.slice(1);
    }
    // Si commence par 225 sans +, ajoute +
    if (cleaned.startsWith("225") && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  };

  const isValidPhone = (phone: string): boolean => {
    // Format: +225 suivi de 10 chiffres (numéros ivoiriens)
    return /^\+225\d{10}$/.test(phone);
  };

  // Compte à rebours pour le renvoi de code
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Étape 1: Envoyer le code SMS ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedPhone = formatPhone(phone);

    if (!isValidPhone(formattedPhone)) {
      addToast("Numéro invalide. Format: +225 07 00 00 00 00", "error");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      addToast("Code SMS envoyé ! Vérifiez votre téléphone.", "success");
      setPhone(formattedPhone);
      setStep("otp");
      startResendTimer();
    } catch (error) {
      const translated: AuthError = translateAuthError(error);
      addToast(translated.message, translated.type);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Étape 2: Vérifier le code OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      addToast("Le code doit contenir 6 chiffres.", "error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      addToast("Le code ne doit contenir que des chiffres.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      addToast("Numéro vérifié ! Bienvenue sur Alliance.", "success");

      // Redirection stricte
      await redirectAfterAuth(null, supabase, router, addToast);
    } catch (error) {
      const translated: AuthError = translateAuthError(error);
      addToast(translated.message, translated.type);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renvoyer un code ---
  const handleResend = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      });

      if (error) throw error;

      addToast("Nouveau code envoyé.", "success");
      startResendTimer();
    } catch (error) {
      const translated: AuthError = translateAuthError(error);
      addToast(translated.message, translated.type);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Revenir au numéro ---
  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setResendTimer(0);
  };

  // ===========================
  //    RENDU ÉTAPE 1: NUMÉRO
  // ===========================
  if (step === "phone") {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
            Numéro de téléphone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 00 00 00 00"
            autoComplete="tel"
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: +225 suivi de votre numéro à 10 chiffres.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-alliance-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Envoi du code…
            </span>
          ) : (
            "Envoyer le code SMS"
          )}
        </button>
      </form>
    );
  }

  // ===========================
  //    RENDU ÉTAPE 2: CODE OTP
  // ===========================
  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div>
        <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-gray-700">
          Code de vérification (6 chiffres)
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          autoComplete="one-time-code"
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          Code envoyé au {phone}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-alliance-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Vérification…
          </span>
        ) : (
          "Vérifier le code"
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleBackToPhone}
          className="text-gray-600 hover:text-alliance-600"
        >
          ← Changer de numéro
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendTimer > 0 || isLoading}
          className={
            resendTimer > 0
              ? "cursor-not-allowed text-gray-400"
              : "text-alliance-600 hover:text-alliance-700 font-medium"
          }
        >
          {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : "Renvoyer le code"}
        </button>
      </div>
    </form>
  );
}
