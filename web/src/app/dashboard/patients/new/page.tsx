import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createPatient } from "@/actions/patients";
import { ui } from "@/lib/ui-classes";

export default async function NewPatientPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permPatAdm) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-12">
      <Link href="/dashboard/patients" className={ui.link}>
        ← Liste des patients
      </Link>
      <div>
        <h1 className={ui.pageTitle}>Nouveau patient</h1>
        <p className={ui.pageSubtitle}>Informations administratives uniquement</p>
      </div>
      <form action={createPatient} className={`${ui.card} space-y-4`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
              Nom
            </label>
            <input name="lastName" required className={ui.input} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
              Prénom
            </label>
            <input name="firstName" required className={ui.input} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Date de naissance
          </label>
          <input type="date" name="birthDate" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Sexe
          </label>
          <select name="sex" className={ui.select}>
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Couverture sociale
          </label>
          <input name="coverageType" required className={ui.input} placeholder="AMO, mutuelle, etc." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Téléphone
          </label>
          <input name="phone" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            CIN (optionnel)
          </label>
          <input name="cin" className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Adresse (optionnel)
          </label>
          <input name="address" className={ui.input} />
        </div>
        <button type="submit" className={`${ui.btnPrimary} w-full`}>
          Créer la fiche
        </button>
      </form>
    </div>
  );
}
