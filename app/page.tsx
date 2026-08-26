import Link from "next/link";
import { config } from "@/lib/config";

// Empêche le prerender statique (page dépend de Supabase runtime)
export const dynamic = "force-dynamic";

/**
 * Landing page d'Alliance.
 * Mobile-first, hero percutant, CTA clair, section confiance, témoignages.
 * Optimisée pour la conversion vers l'inscription.
 */
export default function HomePage() {
  return (
    <div className="hero-gradient">
      {/* --- Hero Section --- */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-alliance-200 bg-alliance-50 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-alliance-500" />
            <span className="text-sm font-medium text-alliance-700">
              100% confiance, 0% pression
            </span>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Trouve ta{" "}
            <span className="bg-gradient-to-r from-alliance-500 to-trust-500 bg-clip-text text-transparent">
              personne
            </span>
            ,<br />
            pas un profilter
          </h1>

          {/* Sous-titre */}
          <p className="mt-6 text-lg text-gray-600 sm:text-xl">
            Alliance réinvente la rencontre en Côte d'Ivoire. Des profils
            réels, vérifiés, basés sur la confiance — pas sur les apparences.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`${config.routes.auth}?mode=signup`}
              className="w-full rounded-xl bg-alliance-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-alliance-500/30 transition-all hover:bg-alliance-600 hover:shadow-xl sm:w-auto"
            >
              Créer mon compte gratuit
            </Link>
            <Link
              href={`${config.routes.auth}?mode=login`}
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-alliance-300 hover:text-alliance-600 sm:w-auto"
            >
              J'ai déjà un compte
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-gray-500">
            🔒 Vos données sont protégées · ⚡ Inscription en 2 minutes ·
            🇨🇮 Pensé pour l'Afrique
          </p>
        </div>
      </section>

      {/* --- Section Valeurs --- */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Pourquoi Alliance ?
          </h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Carte 1 */}
            <div className="rounded-2xl border border-gray-100 p-8 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-alliance-100">
                <svg
                  className="h-6 w-6 text-alliance-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Profils vérifiés
              </h3>
              <p className="mt-2 text-gray-600">
                Chaque membre est vérifié par numéro de téléphone. Fini les
                faux comptes et les arnaques.
              </p>
            </div>

            {/* Carte 2 */}
            <div className="rounded-2xl border border-gray-100 p-8 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-trust-100">
                <svg
                  className="h-6 w-6 text-trust-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                La confiance d'abord
              </h3>
              <p className="mt-2 text-gray-600">
                Pas de swipe anonyme. Vous échangez avec des personnes qui
                partagent vos valeurs et vos envies.
              </p>
            </div>

            {/* Carte 3 */}
            <div className="rounded-2xl border border-gray-100 p-8 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Chat en temps réel
              </h3>
              <p className="mt-2 text-gray-600">
                Discutez instantanément, sans attendre. Un messaging fluide,
                pensé pour le mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Final --- */}
      <section className="bg-gradient-to-br from-alliance-500 to-trust-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Prêt(e) à faire des rencontres qui comptent ?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Rejoins Alliance aujourd'hui. C'est gratuit.
          </p>
          <Link
            href={`${config.routes.auth}?mode=signup`}
            className="mt-8 inline-block rounded-xl bg-white px-10 py-4 text-base font-bold text-alliance-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Alliance. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-alliance-600">
              Confidentialité
            </Link>
            <Link href="#" className="hover:text-alliance-600">
              CGU
            </Link>
            <Link href="#" className="hover:text-alliance-600">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
