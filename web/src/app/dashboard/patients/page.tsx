import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientsLiveSearch } from "@/components/patients-live-search";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function PatientsPage() {
  const user = await requirePageUser();
  const canAdm = hasPermission(user, "permPatAdm");
  const canConst = hasPermission(user, "permPatConst");
  const canMed = hasPermission(user, "permPatMed");
  if (!canAdm && !canConst && !canMed) redirect("/dashboard");

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 300,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Registre clinique</p>
            <h1 className={ui.pageTitle}>Patients</h1>
            <p className={ui.pageSubtitle}>
              {patients.length} fiche(s) chargée(s), recherche administrative instantanée et accès dossier.
            </p>
          </div>
          {canAdm && (
            <Link href="/dashboard/patients/new" className={ui.btnPrimary}>
              Nouveau patient
            </Link>
          )}
        </div>
      </section>

      <PatientsLiveSearch
        patients={patients.map(({ id, lastName, firstName, phone, coverageType, cin }) => ({
          id,
          lastName,
          firstName,
          phone,
          coverageType,
          cin,
        }))}
      />
    </div>
  );
}
