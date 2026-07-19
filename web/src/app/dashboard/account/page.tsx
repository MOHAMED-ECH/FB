import { Role } from "@prisma/client";
import { PasswordForm, ProfileForm } from "@/components/account-forms";
import { isChiefDoctor, requirePageUser } from "@/lib/authorization";
import { ui } from "@/lib/ui-classes";

export default async function AccountPage() {
  const user = await requirePageUser();
  const chiefDoctor = isChiefDoctor(user);
  const roleLabel = user.role === Role.DOCTOR ? "Médecin" : "Secrétariat";
  const initials = initialsFromName(user.name);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <section className="overflow-hidden rounded-lg border border-cabinet-border bg-cabinet-card shadow-[0_18px_55px_-38px_rgba(7,54,36,0.45)]">
        <div className="grid gap-7 px-6 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-cabinet-secondary/40 bg-cabinet-cream font-heading text-2xl font-semibold text-cabinet-primary-dark shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className={ui.eyebrow}>Espace personnel</p>
              <h1 className="mt-1 truncate font-heading text-3xl font-semibold text-cabinet-primary-dark md:text-4xl">
                Mon compte
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-cabinet-muted">
                Gérez vos informations de connexion et vos paramètres personnels depuis un espace sécurisé.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-cabinet-border bg-cabinet-cream/55 p-4">
            <p className="truncate font-heading text-xl font-semibold text-cabinet-primary-dark">{user.name}</p>
            <p className="mt-1 truncate text-sm text-cabinet-muted">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={ui.chip}>{roleLabel}</span>
              {chiefDoctor && (
                <span className="rounded-md border border-cabinet-accent/60 bg-cabinet-accent px-2.5 py-1 text-xs font-semibold uppercase text-cabinet-primary-dark">
                  Médecin chef
                </span>
              )}
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-900">
                Actif
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 border-t border-cabinet-border bg-cabinet-cream/35 md:grid-cols-3">
          <AccountMetric label="Session" value="Sécurisée" hint="Connexion active avec contrôle des droits." />
          <AccountMetric label="Identité" value="Modifiable" hint="Le nom affiché peut être corrigé." />
          <AccountMetric label="Mot de passe" value="Protégé" hint="Modification avec mot de passe actuel." />
        </div>
      </section>

      {chiefDoctor && (
        <section className="rounded-lg border border-cabinet-border bg-cabinet-cream/45 px-5 py-4 shadow-[0_12px_34px_-30px_rgba(7,54,36,0.35)]">
          <div className="flex gap-4">
            <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-cabinet-primary" />
            <div>
              <p className={ui.eyebrow}>Assistance médecin chef</p>
              <p className="mt-1 text-sm leading-6 text-cabinet-muted">
                En cas d’oubli du mot de passe, contactez l’équipe technique du cabinet.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <ProfileForm name={user.name} email={user.email ?? ""} roleLabel={chiefDoctor ? "Médecin chef" : roleLabel} />
        <PasswordForm />
      </div>
    </div>
  );
}

function AccountMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-cabinet-border px-5 py-4 md:border-r md:last:border-r-0">
      <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">{value}</p>
      <p className="mt-1 text-xs leading-5 text-cabinet-muted">{hint}</p>
    </div>
  );
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
