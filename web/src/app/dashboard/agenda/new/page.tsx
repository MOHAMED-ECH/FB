import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ConsultationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppointment } from "@/actions/appointments";
import { ui } from "@/lib/ui-classes";

export default async function NewAppointmentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permRdv) redirect("/dashboard");

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-12">
      <Link href="/dashboard/agenda" className={ui.link}>
        ← Retour à l’agenda
      </Link>
      <div>
        <h1 className={ui.pageTitle}>Nouveau rendez-vous</h1>
        <p className={ui.pageSubtitle}>Patient, horaire, durée et motif</p>
      </div>
      <form action={createAppointment} className={`${ui.card} space-y-5`}>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Patient
          </label>
          <select name="patientId" required className={ui.select}>
            <option value="">— Choisir —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lastName} {p.firstName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Date et heure
          </label>
          <input type="datetime-local" name="start" required className={ui.input} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Durée (minutes)
          </label>
          <input
            type="number"
            name="duration"
            defaultValue={30}
            min={5}
            step={5}
            className={ui.input}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Type
          </label>
          <select name="type" className={ui.select}>
            <option value={ConsultationType.FIRST}>Première consultation</option>
            <option value={ConsultationType.CONTROL}>Contrôle</option>
            <option value={ConsultationType.OTHER}>Autre</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Motif / objet
          </label>
          <input name="motif" required className={ui.input} placeholder="Ex. céphalées, suivi EEG…" />
        </div>
        <button type="submit" className={`${ui.btnPrimary} w-full`}>
          Enregistrer le rendez-vous
        </button>
      </form>
    </div>
  );
}
