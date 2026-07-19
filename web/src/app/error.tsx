"use client";

import Link from "next/link";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cabinet-bg px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-cabinet-border bg-cabinet-card p-7 shadow-[0_22px_70px_-45px_rgba(7,54,36,0.55)]">
        <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Incident applicatif</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-cabinet-primary-dark">
          Une erreur est survenue
        </h1>
        <p className="mt-3 text-sm leading-6 text-cabinet-muted">
          L’application a rencontré un problème temporaire. Vos données ne sont pas affichées sous forme technique.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-cabinet-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cabinet-primary-dark"
          >
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-cabinet-border bg-white px-5 py-2.5 text-sm font-semibold text-cabinet-primary-dark shadow-sm transition hover:bg-cabinet-cream"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </section>
    </main>
  );
}
