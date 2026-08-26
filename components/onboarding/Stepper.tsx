"use client";

import { cn } from "@/lib/utils";

/**
 * Indicateur visuel du stepper d'onboarding.
 * Affiche les étapes complétées (vert), l'étape actuelle (orange), et les étapes futures (gris).
 */
export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="mb-8">
      {/* Barre de progression */}
      <div className="mb-3 flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex flex-1 items-center">
              {/* Cercle d'étape */}
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-alliance-500 text-white ring-4 ring-alliance-100",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Ligne de connexion */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 h-1 flex-1 rounded-full transition-all sm:mx-2",
                    index < currentStep ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Label de l'étape actuelle */}
      <p className="text-center text-sm font-medium text-gray-500">
        Étape {currentStep + 1} sur {steps.length} — {steps[currentStep]}
      </p>
    </div>
  );
}
