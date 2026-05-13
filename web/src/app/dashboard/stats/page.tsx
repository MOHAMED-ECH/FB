import { endOfMonth, startOfMonth } from "date-fns";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppointmentStatus, ConsultationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permStats) redirect("/dashboard");

  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const isDoctor = session.user.role === "DOCTOR";

  const [consultCount, patientCount, revenue, apptFuture, byType] = await Promise.all([
    prisma.consultation.count({ where: { date: { gte: from, lte: to } } }),
    prisma.patient.count(),
    prisma.payment.aggregate({
      where: { paidAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: { status: AppointmentStatus.SCHEDULED, start: { gte: now } },
    }),
    isDoctor
      ? prisma.consultation.groupBy({
          by: ["type"],
          where: { date: { gte: from, lte: to } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { type: ConsultationType; _count: { _all: number } }[]),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      <div>
        <h1 className={ui.pageTitle}>Statistiques</h1>
        <p className={ui.pageSubtitle}>
          {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(from)} — vue consolidée
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={ui.card}>
          <p className={ui.statLabel}>Consultations (mois)</p>
          <p className={ui.statValue}>{consultCount}</p>
        </div>
        <div className={ui.card}>
          <p className={ui.statLabel}>Encaissements (mois)</p>
          <p className={ui.statValue}>{(revenue._sum.amount ?? 0).toFixed(2)} €</p>
        </div>
        <div className={ui.card}>
          <p className={ui.statLabel}>Patients enregistrés</p>
          <p className={ui.statValue}>{patientCount}</p>
        </div>
        <div className={ui.card}>
          <p className={ui.statLabel}>RDV à venir</p>
          <p className={ui.statValue}>{apptFuture}</p>
        </div>
      </div>
      {isDoctor && byType.length > 0 && (
        <section className={ui.card}>
          <h2 className="mb-4 font-heading text-xl font-semibold text-cabinet-primary">Consultations par type</h2>
          <ul className="space-y-2 text-sm">
            {byType.map((row) => (
              <li key={row.type} className="flex justify-between border-b border-cabinet-border/60 py-2 last:border-0">
                <span className="text-cabinet-muted">{row.type}</span>
                <span className="font-semibold text-cabinet-primary">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!isDoctor && (
        <p className="text-center text-xs text-cabinet-muted">
          Le détail par type de consultation est réservé au médecin.
        </p>
      )}
    </div>
  );
}
