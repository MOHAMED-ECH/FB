"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { updateOwnPasswordWithState, updateOwnProfileWithState } from "@/actions/account";
import { FormFeedback } from "@/components/form-feedback";
import { emptyActionState } from "@/lib/action-state";
import { ui } from "@/lib/ui-classes";

const fieldLabelClass = "block min-h-[18px] text-[11px] font-semibold uppercase leading-[18px] text-cabinet-primary-dark";
const fieldClass = `${ui.input} h-12 !py-0 px-4 text-[15px] leading-none`;
const primaryButtonClass = `${ui.btnPrimary} h-12 !py-0 px-6 text-[15px] leading-none`;

export function ProfileForm({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const [state, action] = useActionState(updateOwnProfileWithState, emptyActionState);

  return (
    <section className="h-fit rounded-lg border border-cabinet-border bg-cabinet-card p-5 shadow-[0_16px_45px_-30px_rgba(7,54,36,0.45)]">
      <div className="border-b border-cabinet-border pb-4">
        <p className={ui.eyebrow}>Identité</p>
        <h2 className={ui.sectionTitle}>Informations affichées</h2>
        <p className="mt-2 text-sm leading-6 text-cabinet-muted">
          Ces informations servent à identifier la session et les actions réalisées dans le cabinet.
        </p>
      </div>

      <div className="mt-5 grid gap-4 rounded-lg border border-cabinet-border bg-cabinet-cream/40 p-4 text-sm">
        <InfoLine label="Adresse email" value={email} />
        <InfoLine label="Profil" value={roleLabel} />
      </div>

      <form action={action} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <FieldLabel text="Nom affiché">
            <input name="name" required defaultValue={name} className={fieldClass} />
          </FieldLabel>
          <button type="submit" className={`${primaryButtonClass} w-full whitespace-nowrap sm:w-auto`}>
            Enregistrer
          </button>
        </div>

        <FormFeedback state={state} />
      </form>
    </section>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(updateOwnPasswordWithState, emptyActionState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const mismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;

  return (
    <section className="h-fit rounded-lg border border-cabinet-border bg-cabinet-card p-5 shadow-[0_16px_45px_-30px_rgba(7,54,36,0.45)]">
      <div className="border-b border-cabinet-border pb-4">
        <p className={ui.eyebrow}>Sécurité</p>
        <h2 className={ui.sectionTitle}>Changer le mot de passe</h2>
        <p className="mt-2 text-sm leading-6 text-cabinet-muted">
          La modification exige le mot de passe actuel. Le nouveau mot de passe doit contenir au moins 10 caractères.
        </p>
      </div>

      <form
        action={action}
        className="mt-5 space-y-5"
        onSubmit={(event) => {
          if (newPassword !== confirmPassword) {
            event.preventDefault();
            setLocalError("Les deux nouveaux mots de passe ne correspondent pas.");
            return;
          }
          setLocalError("");
        }}
      >
        <FieldLabel text="Mot de passe actuel">
          <input name="currentPassword" type="password" required className={fieldClass} autoComplete="current-password" />
        </FieldLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel text="Nouveau mot de passe">
            <input
              name="newPassword"
              type="password"
              required
              minLength={10}
              className={fieldClass}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setLocalError("");
              }}
            />
          </FieldLabel>
          <FieldLabel text="Confirmation">
            <input
              type="password"
              required
              minLength={10}
              className={`${fieldClass} ${mismatch ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setLocalError("");
              }}
              aria-invalid={mismatch}
            />
          </FieldLabel>
        </div>

        <div className="grid gap-3 rounded-lg border border-cabinet-border bg-cabinet-cream/40 p-4 text-xs leading-5 text-cabinet-muted sm:grid-cols-3">
          <PasswordRule label="Longueur" value="10 caractères minimum" />
          <PasswordRule label="Confidentialité" value="Ne pas partager" />
          <PasswordRule label="Conseil" value="Éviter les mots évidents" />
        </div>

        {localError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
            {localError}
          </p>
        )}
        <FormFeedback state={state} />

        <button type="submit" className={primaryButtonClass}>
          Mettre à jour le mot de passe
        </button>
      </form>
    </section>
  );
}

function FieldLabel({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className={fieldLabelClass}>{text}</span>
      {children}
    </label>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:items-baseline">
      <span className="text-[11px] font-semibold uppercase leading-5 text-cabinet-muted">{label}</span>
      <span className="min-w-0 font-semibold leading-5 text-cabinet-primary-dark sm:text-right">{value}</span>
    </div>
  );
}

function PasswordRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase leading-4 text-cabinet-primary-dark">{label}</p>
      <p className="leading-5">{value}</p>
    </div>
  );
}
