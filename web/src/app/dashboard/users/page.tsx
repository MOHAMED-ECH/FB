import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSecretaryUser, submitSecretaryPermissions, submitToggleUserActive } from "@/actions/users";
import { PermField } from "@/components/perm-field";
import { ui } from "@/lib/ui-classes";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.DOCTOR) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <div>
        <h1 className={ui.pageTitle}>Utilisateurs</h1>
        <p className={ui.pageSubtitle}>Création de secrétaires et gestion des droits</p>
      </div>

      <section className={ui.card}>
        <h2 className="mb-5 font-heading text-xl font-semibold text-cabinet-primary">Nouvelle secrétaire</h2>
        <form action={createSecretaryUser} className="grid max-w-md gap-4">
          <input name="name" required placeholder="Nom affiché" className={ui.input} />
          <input name="email" type="email" required placeholder="Email" className={ui.input} />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mot de passe (8+ car.)"
            className={ui.input}
          />
          <fieldset className="space-y-3 rounded-xl border border-cabinet-border/80 bg-cabinet-cream/50 p-4 text-sm">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-cabinet-primary">Permissions</legend>
            <PermField name="permRdv" label="Agenda / RDV" defaultChecked />
            <PermField name="permFile" label="Salle d’attente" defaultChecked />
            <PermField name="permPaie" label="Paiements" defaultChecked />
            <PermField name="permPatAdm" label="Fiche patient (admin.)" defaultChecked />
            <PermField name="permPatConst" label="Constantes vitales" />
            <PermField name="permPatMed" label="Dossier médical complet" />
            <PermField name="permStats" label="Statistiques" defaultChecked />
          </fieldset>
          <button type="submit" className={ui.btnPrimary}>
            Créer le compte
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-cabinet-primary">Comptes existants</h2>
        {users.map((u) => (
          <div key={u.id} className={ui.card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-medium text-cabinet-primary">
                  {u.name}{" "}
                  <span className="text-sm font-normal text-cabinet-muted">({u.role})</span>
                </p>
                <p className="text-sm text-cabinet-muted">{u.email}</p>
                <p className="mt-1 text-xs font-medium text-cabinet-accent-dark">{u.active ? "Actif" : "Désactivé"}</p>
              </div>
              {u.role === Role.SECRETARY && (
                <form action={submitToggleUserActive}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="nextActive" value={u.active ? "false" : "true"} />
                  <button type="submit" className={ui.btnGhost}>
                    {u.active ? "Désactiver" : "Réactiver"}
                  </button>
                </form>
              )}
            </div>
            {u.role === Role.SECRETARY && (
              <form action={submitSecretaryPermissions} className="mt-5 border-t border-cabinet-border/70 pt-5">
                <input type="hidden" name="userId" value={u.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <PermField name="permRdv" label="RDV" defaultChecked={u.permRdv} />
                  <PermField name="permFile" label="File" defaultChecked={u.permFile} />
                  <PermField name="permPaie" label="Paiements" defaultChecked={u.permPaie} />
                  <PermField name="permPatAdm" label="Patient admin" defaultChecked={u.permPatAdm} />
                  <PermField name="permPatConst" label="Constantes" defaultChecked={u.permPatConst} />
                  <PermField name="permPatMed" label="Dossier médical" defaultChecked={u.permPatMed} />
                  <PermField name="permStats" label="Stats" defaultChecked={u.permStats} />
                </div>
                <button type="submit" className={`${ui.btnSecondary} mt-4`}>
                  Mettre à jour les droits
                </button>
              </form>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
