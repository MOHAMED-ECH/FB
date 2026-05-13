import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.permPaie) redirect("/dashboard");

  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 100,
    include: { patient: { select: { lastName: true, firstName: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className={ui.pageTitle}>Paiements</h1>
        <p className={ui.pageSubtitle}>Historique récent des encaissements</p>
      </div>
      <div className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Montant</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-cabinet-cream/40">
                  <td className="px-5 py-3.5 text-cabinet-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(p.paidAt)}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-cabinet-text">
                    {p.patient.lastName} {p.patient.firstName}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-cabinet-primary">{p.amount.toFixed(2)} €</td>
                  <td className="px-5 py-3.5 text-cabinet-muted">{p.method}</td>
                  <td className="px-5 py-3.5 text-cabinet-muted">{p.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
