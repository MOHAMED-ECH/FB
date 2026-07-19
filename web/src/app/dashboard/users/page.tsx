import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { isChiefDoctor, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  CreateAccountModal,
  DeleteUserForm,
  UserActiveToggleForm,
  UserPermissionsModal,
} from "@/components/user-management-actions";
import { ui } from "@/lib/ui-classes";

export default async function UsersPage() {
  const user = await requirePageUser();
  if (!isChiefDoctor(user)) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Administration</p>
            <h1 className={ui.pageTitle}>Utilisateurs</h1>
            <p className={ui.pageSubtitle}>
              Création de comptes secrétariat et gestion fine des droits d’accès.
            </p>
          </div>
          <CreateAccountModal />
        </div>
      </section>

      <div className="grid gap-6">
        <section className="space-y-4">
          <h2 className={ui.sectionTitle}>Comptes existants</h2>
          {users.map((account) => (
            <article key={account.id} className={ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-xl font-semibold text-cabinet-primary-dark">
                    {account.name} <span className="text-sm font-normal text-cabinet-muted">({account.role})</span>
                  </p>
                  <p className="text-sm text-cabinet-muted">{account.email}</p>
                  <p className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={
                        account.active
                          ? ui.chip
                          : "inline-flex rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800"
                      }
                    >
                      {account.active ? "Actif" : "Désactivé"}
                    </span>
                    {account.isChiefDoctor && (
                      <span className="inline-flex rounded-md border border-cabinet-secondary/70 bg-cabinet-cream px-2.5 py-1 text-xs font-semibold text-cabinet-primary-dark">
                        Médecin chef
                      </span>
                    )}
                  </p>
                </div>

                {!account.isChiefDoctor && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {account.role === Role.SECRETARY && <UserPermissionsModal account={account} />}
                    <UserActiveToggleForm account={account} />
                    <DeleteUserForm account={account} />
                  </div>
                )}
              </div>

              {account.role === Role.SECRETARY ? (
                <div className="mt-5 grid gap-2 border-t border-cabinet-border pt-5 text-sm sm:grid-cols-2">
                  <PermissionBadge active={account.permRdv} label="Agenda / RDV" />
                  <PermissionBadge active={account.permFile} label="Salle d’attente" />
                  <PermissionBadge active={account.permPaie} label="Paiements" />
                  <PermissionBadge active={account.permPatAdm} label="Fiche administrative" />
                  <PermissionBadge active={account.permPatConst} label="Constantes" />
                  <PermissionBadge active={account.permPatMed} label="Dossier médical" />
                  <PermissionBadge active={account.permStats} label="Statistiques" />
                </div>
              ) : (
                <div className="mt-5 rounded-md border border-cabinet-secondary/50 bg-cabinet-cream/55 px-4 py-3 text-sm font-semibold text-cabinet-primary-dark">
                  Accès médecin complet : dossier médical, consultations, agenda, paiements, statistiques et administration.
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function PermissionBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-md border px-3 py-2 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-cabinet-border bg-cabinet-cream/55 text-cabinet-muted"
      }`}
    >
      {label} : {active ? "autorisé" : "non autorisé"}
    </span>
  );
}
