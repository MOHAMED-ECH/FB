import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitCancelAppointment, submitDeleteAppointment } from "@/actions/appointments";
import { ui } from "@/lib/ui-classes";

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permRdv) redirect("/dashboard");

  const from = startOfDay(new Date());
  const to = addDays(from, 21);

  const appointments = await prisma.appointment.findMany({
    where: {
      start: { gte: from, lte: to },
      status: AppointmentStatus.SCHEDULED,
    },
    include: { patient: true },
    orderBy: { start: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Agenda</h1>
          <p className={ui.pageSubtitle}>Vue sur 3 semaines — créneaux confirmés</p>
        </div>
        <Link href="/dashboard/agenda/new" className={ui.btnPrimary}>
          + Nouveau RDV
        </Link>
      </div>

      <div className={`${ui.card} overflow-hidden p-0`}>
        <ul className={ui.cardList}>
          {appointments.length === 0 ? (
            <li className="px-6 py-12 text-center text-sm text-cabinet-muted">Aucun rendez-vous sur cette période.</li>
          ) : (
            appointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 px-6 py-5 transition hover:bg-cabinet-cream/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading text-lg font-medium text-cabinet-primary">
                    {a.patient.lastName} {a.patient.firstName}
                  </p>
                  <p className="mt-1 text-sm text-cabinet-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(a.start)} →{" "}
                    {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(a.end)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-cabinet-accent-dark">
                    {a.type} · {a.motif}
                  </p>
                </div>
                {session.user.permRdv && a.status === AppointmentStatus.SCHEDULED && (
                  <div className="flex flex-wrap gap-2">
                    <form action={submitCancelAppointment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={ui.btnGhost}>
                        Annuler
                      </button>
                    </form>
                    <form action={submitDeleteAppointment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={ui.btnDanger}>
                        Supprimer
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <p className="text-center text-xs text-cabinet-muted">
        Astuce : les chevauchements sont bloqués à l’enregistrement.
      </p>
    </div>
  );
}
