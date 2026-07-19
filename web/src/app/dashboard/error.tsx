"use client";

import Link from "next/link";
import { ui } from "@/lib/ui-classes";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className={`${ui.card} mx-auto max-w-2xl`}>
      <p className={ui.eyebrow}>Erreur</p>
      <h1 className={ui.pageTitle}>Cette section n’a pas pu être chargée</h1>
      <p className={ui.pageSubtitle}>
        Une erreur temporaire s’est produite. L’action peut être relancée sans afficher de détails techniques.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={ui.btnPrimary}>
          Réessayer
        </button>
        <Link href="/dashboard" className={ui.btnSecondary}>
          Retour à l’accueil
        </Link>
      </div>
    </section>
  );
}
