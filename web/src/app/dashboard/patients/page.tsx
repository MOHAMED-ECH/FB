import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u || (!u.permPatAdm && !u.permPatMed && u.role !== "DOCTOR")) redirect("/dashboard");

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Patients</h1>
          <p className={ui.pageSubtitle}>{patients.length} fiche(s) — recherche et dossiers</p>
        </div>
        {u.permPatAdm && (
          <Link href="/dashboard/patients/new" className={ui.btnPrimary}>
            + Nouveau patient
          </Link>
        )}
      </div>
      <div className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Prénom</th>
                <th className="px-5 py-3">Téléphone</th>
                <th className="px-5 py-3">Couverture</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {patients.map((p) => (
                <tr key={p.id} className="transition hover:bg-cabinet-cream/50">
                  <td className="px-5 py-3.5 font-medium text-cabinet-text">{p.lastName}</td>
                  <td className="px-5 py-3.5">{p.firstName}</td>
                  <td className="px-5 py-3.5 text-cabinet-muted">{p.phone}</td>
                  <td className="px-5 py-3.5 text-cabinet-muted">{p.coverageType}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/dashboard/patients/${p.id}`} className={ui.link}>
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
