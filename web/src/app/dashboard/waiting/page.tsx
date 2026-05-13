import { endOfDay, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { WaitingStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitAddToWaiting, submitWaitingStatus } from "@/actions/waiting";
import { ui } from "@/lib/ui-classes";

export default async function WaitingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permFile) redirect("/dashboard");

  const day = new Date();
  const entries = await prisma.waitingEntry.findMany({
    where: { day: { gte: startOfDay(day), lte: endOfDay(day) } },
    include: { patient: true },
    orderBy: { arrivedAt: "asc" },
  });

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const active = entries.filter((e) => e.status !== WaitingStatus.DONE);
  const done = entries.filter((e) => e.status === WaitingStatus.DONE);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className={ui.pageTitle}>Salle d’attente</h1>
        <p className={ui.pageSubtitle}>Aujourd’hui — ordre d’arrivée, suivi en temps réel</p>
      </div>

      <form
        action={submitAddToWaiting}
        className={`${ui.card} flex flex-wrap items-end gap-4`}
      >
        <div className="min-w-[220px] flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
            Ajouter à la file
          </label>
          <select name="patientId" required className={ui.select}>
            <option value="">— Choisir un patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lastName} {p.firstName}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={ui.btnPrimary}>
          Ajouter
        </button>
      </form>

      <section className={`${ui.card} p-0`}>
        <div className="border-b border-cabinet-border/80 bg-gradient-to-r from-cabinet-primary/8 to-transparent px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-cabinet-primary">En attente / en cours</h2>
        </div>
        <ul className={ui.cardList}>
          {active.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-cabinet-muted">Personne en attente pour le moment.</li>
          ) : (
            active.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-4 px-6 py-5 transition hover:bg-cabinet-cream/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading text-lg font-medium text-cabinet-primary">
                    {e.patient.lastName} {e.patient.firstName}
                  </p>
                  <p className="mt-1 text-xs text-cabinet-muted">
                    Arrivée : {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(e.arrivedAt)} ·{" "}
                    <span className="font-semibold text-cabinet-accent-dark">{e.status}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.status === WaitingStatus.WAITING && (
                    <form action={submitWaitingStatus}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="status" value={WaitingStatus.IN_PROGRESS} />
                      <button type="submit" className={ui.btnSecondary}>
                        En consultation
                      </button>
                    </form>
                  )}
                  <form action={submitWaitingStatus}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={WaitingStatus.DONE} />
                    <button type="submit" className={ui.btnPrimary}>
                      Terminé
                    </button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {done.length > 0 && (
        <section className={`${ui.cardCompact} border-dashed bg-cabinet-cream/60`}>
          <h3 className="mb-3 font-heading text-sm font-semibold text-cabinet-primary">Traités aujourd’hui</h3>
          <ul className="flex flex-wrap gap-2 text-sm text-cabinet-muted">
            {done.map((e) => (
              <li
                key={e.id}
                className="rounded-full border border-cabinet-border/80 bg-white/80 px-3 py-1 text-cabinet-text"
              >
                {e.patient.lastName} {e.patient.firstName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
