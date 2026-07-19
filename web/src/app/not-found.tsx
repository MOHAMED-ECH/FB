import Link from "next/link";
import { ui } from "@/lib/ui-classes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cabinet-bg px-4 py-10">
      <section className={`${ui.card} max-w-xl`}>
        <p className={ui.eyebrow}>Introuvable</p>
        <h1 className={ui.pageTitle}>Page ou dossier introuvable</h1>
        <p className={ui.pageSubtitle}>
          L’élément demandé n’existe pas, a été supprimé ou n’est plus accessible avec vos droits actuels.
        </p>
        <div className="mt-6">
          <Link href="/dashboard" className={ui.btnPrimary}>
            Retour au tableau de bord
          </Link>
        </div>
      </section>
    </main>
  );
}
