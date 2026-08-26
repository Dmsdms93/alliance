/**
 * Mapping des erreurs Supabase Auth vers des messages français clairs.
 * Centralise toute la gestion d'erreurs pour éviter les crashes UI.
 */

export interface AuthError {
  message: string;
  type: "error" | "info" | "success";
}

const errorMap: Record<string, string> = {
  // --- Email/Password ---
  invalid_credentials: "Email ou mot de passe incorrect.",
  user_not_found: "Aucun compte trouvé avec cet email.",
  email_exists: "Cet email est déjà utilisé. Essayez de vous connecter.",
  email_address_not_authorized: "Cette adresse email n'est pas autorisée.",
  email_address_invalid: "L'adresse email n'est pas valide.",
  password_too_short: "Le mot de passe doit contenir au moins 6 caractères.",
  password_too_long: "Le mot de passe est trop long (max 72 caractères).",
  weak_password: "Le mot de passe est trop faible. Utilisez au moins 6 caractères.",

  // --- OAuth Google ---
  provider_disabled: "La connexion Google est temporairement désactivée.",
  identity_already_exists: "Un compte existe déjà avec cet email via Google.",
  oidc_missing_code: "Erreur lors de la connexion Google. Réessayez.",
  oidc_invalid_state: "Session Google expirée. Réessayez.",
  no_authorization_code: "Autorisation Google refusée. Réessayez.",

  // --- Phone OTP ---
  phone_not_confirmed: "Le numéro de téléphone n'est pas encore confirmé.",
  phone_number_invalid: "Numéro de téléphone invalide. Format: +225 07 00 00 00 00",
  phone_otp_expired: "Le code SMS a expiré. Demandez un nouveau code.",
  phone_otp_invalid: "Code SMS incorrect. Vérifiez les 6 chiffres.",
  otp_expired: "Le code a expiré. Demandez un nouveau code.",
  otp_invalid: "Code invalide. Vérifiez et réessayez.",
  rate_limit_exceeded: "Trop de tentatives. Attendez quelques minutes.",
  over_request_rate_limit: "Trop de SMS envoyés. Réessayez dans 5 minutes.",
  phone_provider_disabled: "L'authentification par téléphone est désactivée.",
  captcha_failed: "Vérification anti-bot échouée. Réessayez.",

  // --- Général ---
  session_expired: "Votre session a expiré. Reconnectez-vous.",
  network_error: "Problème de connexion. Vérifiez votre internet.",
  unexpected_error: "Une erreur inattendue s'est produite. Réessayez.",
  user_already_registered: "Ce compte existe déjà. Connectez-vous.",
  signup_disabled: "Les inscriptions sont temporairement désactivées.",
  email_not_confirmed: "Confirmez votre email avant de vous connecter.",
  request_id_not_found: "Demande expirée. Réessayez depuis le début.",
};

/**
 * Traduit une erreur Supabase en message utilisateur friendly.
 */
export function translateAuthError(error: unknown): AuthError {
  // Erreur Supabase Auth standard
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    if (errorMap[code]) {
      return { message: errorMap[code], type: "error" };
    }
  }

  // Erreur avec message Supabase
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: string }).message.toLowerCase();

    // Match par mot-clé dans le message
    if (message.includes("invalid login credentials")) {
      return { message: errorMap.invalid_credentials, type: "error" };
    }
    if (message.includes("already registered") || message.includes("already been registered")) {
      return { message: errorMap.email_exists, type: "error" };
    }
    if (message.includes("password should be at least")) {
      return { message: errorMap.weak_password, type: "error" };
    }
    if (message.includes("rate limit") || message.includes("too many")) {
      return { message: errorMap.rate_limit_exceeded, type: "error" };
    }
    if (message.includes("phone") && message.includes("invalid")) {
      return { message: errorMap.phone_number_invalid, type: "error" };
    }
    if (message.includes("otp") && message.includes("expired")) {
      return { message: errorMap.otp_expired, type: "error" };
    }
    if (message.includes("otp") && (message.includes("invalid") || message.includes("incorrect"))) {
      return { message: errorMap.otp_invalid, type: "error" };
    }
    if (message.includes("captcha")) {
      return { message: errorMap.captcha_failed, type: "error" };
    }
    if (message.includes("network") || message.includes("fetch")) {
      return { message: errorMap.network_error, type: "error" };
    }

    // Retourne le message brut si on n'a pas de traduction
    return { message: (error as { message: string }).message, type: "error" };
  }

  // Fallback générique
  if (error instanceof Error) {
    return { message: error.message || errorMap.unexpected_error, type: "error" };
  }

  return { message: errorMap.unexpected_error, type: "error" };
}
