"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/auth/Toast";
import { Stepper } from "@/components/onboarding/Stepper";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Composant principal de l'onboarding.
 * Stepper en 4 étapes : Prénom → Âge → Genre → Photo de profil.
 * Upload photo vers R2 via API route, soumission via /api/create-profile (avec webhook).
 */

const STEPS = ["Prénom", "Âge", "Genre", "Photo"];

type Gender = "homme" | "femme";
type LookingFor = "homme" | "femme" | "les deux";

interface OnboardingData {
  firstName: string;
  age: number;
  gender: Gender;
  lookingFor: LookingFor;
  photoUrl: string | null;
}

export function OnboardingClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données du formulaire
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    age: 18,
    gender: "homme",
    lookingFor: "femme",
    photoUrl: null,
  });

  // --- Photo upload state ---
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================
  //    VALIDATION PAR ÉTAPE
  // ============================
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Prénom
        if (data.firstName.trim().length < 2) {
          addToast("Votre prénom doit contenir au moins 2 caractères.", "error");
          return false;
        }
        if (data.firstName.trim().length > 30) {
          addToast("Votre prénom ne peut pas dépasser 30 caractères.", "error");
          return false;
        }
        return true;

      case 1: // Âge
        if (data.age < config.limits.minAge) {
          addToast(`Vous devez avoir au moins ${config.limits.minAge} ans.`, "error");
          return false;
        }
        if (data.age > config.limits.maxAge) {
          addToast(`L'âge maximum est ${config.limits.maxAge} ans.`, "error");
          return false;
        }
        return true;

      case 2: // Genre
        if (!data.gender || !data.lookingFor) {
          addToast("Veuillez sélectionner votre genre et ce que vous cherchez.", "error");
          return false;
        }
        return true;

      case 3: // Photo
        if (!data.photoUrl) {
          addToast("Veuillez ajouter une photo de profil.", "error");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // ============================
  //    NAVIGATION STEPPER
  // ============================
  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ============================
  //    UPLOAD PHOTO VERS R2
  // ============================
  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validation client
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        addToast("Format non supporté. Utilisez JPG, PNG ou WebP.", "error");
        return;
      }

      if (file.size > config.limits.maxPhotoSize) {
        addToast("La photo dépasse 5MB.", "error");
        return;
      }

      // Preview immédiate
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Upload vers R2 via API route
      setIsUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("photo", file);

        const response = await fetch("/api/upload-profile-photo", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de l'upload.");
        }

        setData((prev) => ({ ...prev, photoUrl: result.url }));
        addToast("Photo ajoutée !", "success");
      } catch (error) {
        addToast(
          error instanceof Error ? error.message : "Erreur lors de l'upload de la photo.",
          "error"
        );
        setPhotoPreview(null);
        setData((prev) => ({ ...prev, photoUrl: null }));
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [addToast]
  );

  // ============================
  //    SOUMISSION FINALE
  // ============================
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Appel API route : crée le profil dans Supabase + déclenche le webhook
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          age: data.age,
          gender: data.gender,
          lookingFor: data.lookingFor,
          photoUrl: data.photoUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création du profil.");
      }

      addToast("Profil créé ! Bienvenue sur Alliance.", "success");

      // Redirection vers le dashboard
      router.push(config.routes.dashboard);
    } catch (error) {
      console.error("[onboarding] Erreur:", error);
      addToast(
        error instanceof Error ? error.message : "Erreur lors de la création du profil.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================
  //    RENDU DES ÉTAPES
  // ============================
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-alliance-50 via-white to-trust-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Titre */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Créez votre profil</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cela prend moins d&apos;une minute.
          </p>
        </div>

        {/* Carte */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
          <Stepper steps={STEPS} currentStep={currentStep} />

          {/* --- ÉTAPE 0: PRÉNOM --- */}
          {currentStep === 0 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                  Quel est votre prénom ?
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  placeholder="Votre prénom"
                  autoComplete="given-name"
                  maxLength={30}
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20"
                />
              </div>
              <p className="text-sm text-gray-500">
                C&apos;est ainsi que les autres vous verront sur Alliance.
              </p>
            </div>
          )}

          {/* --- ÉTAPE 1: ÂGE --- */}
          {currentStep === 1 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <label htmlFor="age" className="mb-2 block text-sm font-medium text-gray-700">
                  Quel est votre âge ?
                </label>
                <input
                  id="age"
                  type="number"
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 18 })}
                  min={config.limits.minAge}
                  max={config.limits.maxAge}
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl font-bold outline-none transition-all focus:border-alliance-500 focus:ring-2 focus:ring-alliance-500/20"
                />
              </div>
              {/* Slider */}
              <div>
                <input
                  type="range"
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
                  min={config.limits.minAge}
                  max={config.limits.maxAge}
                  className="w-full accent-alliance-500"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{config.limits.minAge} ans</span>
                  <span>{config.limits.maxAge} ans</span>
                </div>
              </div>
            </div>
          )}

          {/* --- ÉTAPE 2: GENRE --- */}
          {currentStep === 2 && (
            <div className="animate-fade-in space-y-6">
              {/* Genre de l'utilisateur */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Vous êtes :</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["homme", "femme"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setData({ ...data, gender: g })}
                      className={cn(
                        "rounded-xl border-2 py-4 text-sm font-medium transition-all",
                        data.gender === g
                          ? "border-alliance-500 bg-alliance-50 text-alliance-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {g === "homme" ? "Un homme" : "Une femme"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre recherché */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Vous cherchez :</p>
                <div className="grid grid-cols-3 gap-3">
                  {(["femme", "homme", "les deux"] as LookingFor[]).map((lf) => (
                    <button
                      key={lf}
                      onClick={() => setData({ ...data, lookingFor: lf })}
                      className={cn(
                        "rounded-xl border-2 py-4 text-sm font-medium transition-all",
                        data.lookingFor === lf
                          ? "border-alliance-500 bg-alliance-50 text-alliance-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {lf === "les deux" ? "Les deux" : lf === "homme" ? "Un homme" : "Une femme"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ÉTAPE 3: PHOTO --- */}
          {currentStep === 3 && (
            <div className="animate-fade-in space-y-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Ajoutez votre photo de profil
              </p>

              {/* Zone d'upload */}
              <div
                onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
                  photoPreview
                    ? "border-alliance-500 bg-alliance-50"
                    : "border-gray-300 hover:border-alliance-400 hover:bg-alliance-50/50",
                  isUploadingPhoto && "cursor-wait opacity-70"
                )}
              >
                {photoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                    <p className="text-sm font-medium text-alliance-600">
                      Photo ajoutée ✓ — Cliquez pour changer
                    </p>
                  </div>
                ) : isUploadingPhoto ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-alliance-500 border-t-transparent" />
                    <p className="text-sm text-gray-500">Upload en cours…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      Cliquez pour ajouter une photo
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG ou WebP — 5MB max</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          )}

          {/* --- BOUTONS NAVIGATION --- */}
          <div className="mt-8 flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isSubmitting || isUploadingPhoto}
                className="rounded-xl border border-gray-300 px-6 py-3.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                Retour
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isUploadingPhoto}
                className="flex-1 rounded-xl bg-alliance-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 disabled:opacity-50 disabled:shadow-none"
              >
                Continuer
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingPhoto || !data.photoUrl}
                className="flex-1 rounded-xl bg-alliance-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Création…
                  </span>
                ) : (
                  "Terminer mon profil"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
