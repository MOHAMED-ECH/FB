import { redirect } from "next/navigation";
import { AuditLiveSearch } from "@/components/audit-live-search";
import { isChiefDoctor, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function AuditPage() {
  const user = await requirePageUser();
  if (!isChiefDoctor(user)) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { user: { select: { email: true, name: true } } },
  });

  const rows = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    userName: log.user?.name ?? "",
    userEmail: log.user?.email ?? "",
    action: log.action,
    resource: log.resource,
    meta: log.meta ?? "",
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <div>
          <p className={ui.eyebrow}>Traçabilité</p>
          <h1 className={ui.pageTitle}>Journal d’audit</h1>
          <p className={ui.pageSubtitle}>Suivi des actions sensibles, connexions et modifications métier.</p>
        </div>
      </section>

      <AuditLiveSearch logs={rows} />
    </div>
  );
}
