import Link from "next/link";
import { redirect } from "next/navigation";
import { AppointmentForm } from "@/components/appointment-form";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function NewAppointmentPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permRdv")) redirect("/dashboard");

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <Link href="/dashboard/agenda" className={ui.link}>
          Retour à l’agenda
        </Link>
        <div className="mt-4">
          <p className={ui.eyebrow}>Planification</p>
          <h1 className={ui.pageTitle}>Nouveau rendez-vous</h1>
          <p className={ui.pageSubtitle}>Choisir le patient, l’horaire, la durée et le motif de consultation.</p>
        </div>
      </section>

      <AppointmentForm
        patients={patients.map(({ id, lastName, firstName, phone, cin }) => ({
          id,
          lastName,
          firstName,
          phone,
          cin,
        }))}
      />
    </div>
  );
}
