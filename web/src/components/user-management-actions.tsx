"use client";

import { useActionState, useState } from "react";
import {
  createUserWithState,
  deleteUserWithState,
  submitSecretaryPermissionsWithState,
  submitToggleUserActiveWithState,
} from "@/actions/users";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ConsultationModal } from "@/components/consultation-modal";
import { FormFeedback } from "@/components/form-feedback";
import { PermField } from "@/components/perm-field";
import { StatefulActionForm } from "@/components/stateful-action-form";
import { emptyActionState } from "@/lib/action-state";
import { ui } from "@/lib/ui-classes";

type AccountRole = "DOCTOR" | "SECRETARY";

type SecretaryPermissions = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  permRdv: boolean;
  permFile: boolean;
  permPaie: boolean;
  permPatAdm: boolean;
  permPatConst: boolean;
  permPatMed: boolean;
  permStats: boolean;
};

export function CreateAccountModal() {
  return (
    <ConsultationModal
      triggerLabel="Nouveau compte"
      eyebrow="Administration"
      title="Créer un compte utilisateur"
      description="Créer un accès nominatif pour un médecin ou un membre du secrétariat."
      triggerClassName={ui.btnPrimary}
    >
      <CreateAccountForm />
    </ConsultationModal>
  );
}

function CreateAccountForm() {
  const [state, action] = useActionState(createUserWithState, emptyActionState);
  const [role, setRole] = useState<AccountRole>("SECRETARY");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;
  const isDoctor = role === "DOCTOR";

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={(event) => {
        if (password !== confirmPassword) {
          event.preventDefault();
          setLocalError("Les deux mots de passe ne correspondent pas.");
          return;
        }
        setLocalError("");
      }}
    >
      <input type="hidden" name="role" value={role} />

      <section className="rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4">
        <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Rôle du compte</p>
        <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Type d’accès</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RoleChoice
            active={role === "SECRETARY"}
            title="Secrétaire"
            description="Accès limité selon les permissions choisies."
            onClick={() => setRole("SECRETARY")}
          />
          <RoleChoice
            active={role === "DOCTOR"}
            title="Médecin"
            description="Accès médical complet et administration du cabinet."
            onClick={() => setRole("DOCTOR")}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-cabinet-border bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Identité</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Informations du compte</h3>
        </div>
        <Field label="Nom affiché">
          <input
            name="name"
            required
            placeholder={isDoctor ? "Ex. Dr. Nadia Filali" : "Ex. Salma Bennani"}
            className={ui.input}
          />
        </Field>
        <Field label="Email de connexion">
          <input
            name="email"
            type="email"
            required
            placeholder={isDoctor ? "medecin@cabinet.ma" : "secretaire@cabinet.ma"}
            className={ui.input}
          />
        </Field>
      </section>

      <section className="rounded-md border border-cabinet-border bg-white p-4">
        <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Sécurité</p>
        <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Mot de passe initial</h3>
        <p className="mt-2 text-sm leading-6 text-cabinet-muted">
          Utiliser au moins 10 caractères. Le mot de passe doit être communiqué par un canal sécurisé.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Mot de passe">
            <input
              name="password"
              type="password"
              required
              minLength={10}
              placeholder="10 caractères minimum"
              className={ui.input}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLocalError("");
              }}
            />
          </Field>
          <Field label="Confirmation">
            <input
              type="password"
              required
              minLength={10}
              placeholder="Ressaisir le mot de passe"
              className={`${ui.input} ${passwordMismatch ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setLocalError("");
              }}
              aria-invalid={passwordMismatch}
            />
          </Field>
        </div>
      </section>

      {role === "SECRETARY" ? (
        <fieldset className="grid gap-3 rounded-md border border-cabinet-border bg-white p-4 text-sm sm:grid-cols-2">
          <legend className="px-1 text-xs font-bold uppercase text-cabinet-primary-dark">Permissions initiales</legend>
          <PermField name="permRdv" label="Agenda / RDV" defaultChecked />
          <PermField name="permFile" label="Salle d’attente" defaultChecked />
          <PermField name="permPaie" label="Paiements" defaultChecked />
          <PermField name="permPatAdm" label="Fiche patient administrative" defaultChecked />
          <PermField name="permPatConst" label="Constantes vitales" />
          <PermField name="permPatMed" label="Dossier médical complet" />
          <PermField name="permStats" label="Statistiques" defaultChecked />
        </fieldset>
      ) : (
        <div className="rounded-md border border-cabinet-secondary/50 bg-cabinet-cream/55 px-4 py-3 text-sm leading-6 text-cabinet-muted">
          Le compte médecin dispose automatiquement des accès médicaux complets, de la gestion du cabinet et des
          fonctions d’administration.
        </div>
      )}

      {localError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          {localError}
        </p>
      )}
      <FormFeedback state={state} />

      <div className="flex justify-end border-t border-cabinet-border pt-5">
        <button type="submit" className={ui.btnPrimary}>
          Créer le compte
        </button>
      </div>
    </form>
  );
}

export function UserPermissionsModal({ account }: { account: SecretaryPermissions }) {
  return (
    <ConsultationModal
      triggerLabel="Modifier les droits"
      eyebrow="Administration"
      title={`Droits de ${account.name}`}
      description="Les permissions sont modifiées dans une fenêtre dédiée afin d’éviter les changements involontaires."
      triggerClassName={ui.btnSecondary}
    >
      <StatefulActionForm action={submitSecretaryPermissionsWithState} className="space-y-5">
        <input type="hidden" name="userId" value={account.id} />
        <div className="rounded-md border border-cabinet-border bg-cabinet-cream/45 px-4 py-3">
          <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">{account.name}</p>
          <p className="mt-1 text-sm text-cabinet-muted">{account.email}</p>
        </div>
        <fieldset className="grid gap-3 rounded-md border border-cabinet-border bg-white p-4 text-sm sm:grid-cols-2">
          <legend className="px-1 text-xs font-bold uppercase text-cabinet-primary-dark">Permissions</legend>
          <PermField name="permRdv" label="Agenda / RDV" defaultChecked={account.permRdv} />
          <PermField name="permFile" label="Salle d’attente" defaultChecked={account.permFile} />
          <PermField name="permPaie" label="Paiements" defaultChecked={account.permPaie} />
          <PermField name="permPatAdm" label="Fiche patient administrative" defaultChecked={account.permPatAdm} />
          <PermField name="permPatConst" label="Constantes vitales" defaultChecked={account.permPatConst} />
          <PermField name="permPatMed" label="Dossier médical complet" defaultChecked={account.permPatMed} />
          <PermField name="permStats" label="Statistiques" defaultChecked={account.permStats} />
        </fieldset>
        <div className="flex justify-end border-t border-cabinet-border pt-5">
          <button type="submit" className={ui.btnPrimary}>
            Enregistrer les droits
          </button>
        </div>
      </StatefulActionForm>
    </ConsultationModal>
  );
}

export function UserActiveToggleForm({ account }: { account: Pick<SecretaryPermissions, "id" | "name" | "active"> }) {
  const nextActive = !account.active;
  const label = account.active ? "Désactiver" : "Réactiver";

  return (
    <StatefulActionForm action={submitToggleUserActiveWithState} className="space-y-2">
      <input type="hidden" name="userId" value={account.id} />
      <input type="hidden" name="nextActive" value={String(nextActive)} />
      <ConfirmSubmitButton
        message={`${label} le compte ${account.name} ?`}
        confirmTitle={`${label} le compte`}
        confirmDescription={
          account.active
            ? "Ce compte ne pourra plus accéder à l’application tant qu’il reste désactivé."
            : "Ce compte pourra de nouveau accéder à l’application avec ses droits actuels."
        }
        className={account.active ? ui.btnGhost : ui.btnSecondary}
      >
        {label}
      </ConfirmSubmitButton>
    </StatefulActionForm>
  );
}

export function DeleteUserForm({ account }: { account: Pick<SecretaryPermissions, "id" | "name"> }) {
  return (
    <StatefulActionForm action={deleteUserWithState} className="space-y-2">
      <input type="hidden" name="userId" value={account.id} />
      <ConfirmSubmitButton
        message={`Retirer l'acces du compte ${account.name} ?`}
        confirmTitle="Supprimer ou désactiver le compte"
        confirmDescription="Le compte sera supprimé s’il n’a aucun historique. Sinon, il sera désactivé afin de conserver les consultations et les traces d’audit."
        className={ui.btnDanger}
      >
        Retirer l&apos;acces
      </ConfirmSubmitButton>
    </StatefulActionForm>
  );
}

function RoleChoice({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-3 text-left transition ${
        active
          ? "border-cabinet-primary bg-white shadow-[inset_4px_0_0_rgba(35,98,69,0.95)]"
          : "border-cabinet-border bg-white/70 hover:bg-white"
      }`}
      aria-pressed={active}
    >
      <span className="block font-heading text-lg font-semibold text-cabinet-primary-dark">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-cabinet-muted">{description}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">{label}</span>
      {children}
    </label>
  );
}
