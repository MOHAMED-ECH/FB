import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.DOCTOR) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className={ui.pageTitle}>Journal d’audit</h1>
        <p className={ui.pageSubtitle}>Traçabilité des actions sensibles</p>
      </div>
      <div className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Ressource</th>
                <th className="px-4 py-3">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-cabinet-cream/40">
                  <td className="px-4 py-3 whitespace-nowrap text-cabinet-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(l.createdAt)}
                  </td>
                  <td className="px-4 py-3">{l.user?.name ?? l.user?.email ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-cabinet-primary">{l.action}</td>
                  <td className="px-4 py-3 text-cabinet-muted">{l.resource}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-cabinet-muted">{l.meta ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
