import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { createPatientWithState } from "@/actions/patients";
import { StatefulActionForm } from "@/components/stateful-action-form";
import { ui } from "@/lib/ui-classes";

export default async function NewPatientPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permPatAdm")) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <Link href="/dashboard/patients" className={ui.link}>
          ← Liste des patients
        </Link>
        <div className="mt-4">
          <p className={ui.eyebrow}>Admission</p>
          <h1 className={ui.pageTitle}>Nouveau patient</h1>
          <p className={ui.pageSubtitle}>Créer une fiche administrative claire avant le suivi médical.</p>
        </div>
      </section>

      <StatefulActionForm action={createPatientWithState} className={`${ui.card} grid gap-5 sm:grid-cols-2`}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Nom</label>
          <input name="lastName" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Prénom</label>
          <input name="firstName" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Date de naissance</label>
          <input type="date" name="birthDate" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Sexe</label>
          <select name="sex" className={ui.select}>
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Couverture sociale</label>
          <input name="coverageType" required className={ui.input} placeholder="AMO, mutuelle, assurance..." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Téléphone</label>
          <input name="phone" required className={ui.input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">CIN</label>
          <input name="cin" className={ui.input} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">Adresse</label>
          <input name="address" className={ui.input} />
        </div>
        <button type="submit" className={`${ui.btnPrimary} sm:col-span-2`}>
          Créer la fiche
        </button>
      </StatefulActionForm>
    </div>
  );
}
