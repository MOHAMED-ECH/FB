"use client";

import { WaitingStatus } from "@prisma/client";
import { useActionState } from "react";
import { submitAddToWaitingWithState, submitWaitingStatusWithState } from "@/actions/waiting";
import { emptyActionState } from "@/lib/action-state";
import { ui } from "@/lib/ui-classes";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { PatientCombobox } from "@/components/patient-combobox";

type PatientOption = {
  id: string;
  lastName: string;
  firstName: string;
  phone?: string | null;
  cin?: string | null;
};

export function AddToWaitingForm({ patients }: { patients: PatientOption[] }) {
  const [state, action] = useActionState(submitAddToWaitingWithState, emptyActionState);

  return (
    <form action={action} className={`${ui.card} grid gap-4 md:grid-cols-[1fr_auto] md:items-end`}>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">
          Ajouter un patient à la file
        </label>
        <PatientCombobox patients={patients} placeholder="Saisir le nom, téléphone ou CIN" />
      </div>
      <SubmitButton className={ui.btnPrimary} pendingLabel="Ajout...">
        Ajouter
      </SubmitButton>
      <div className="md:col-span-2">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}

export function WaitingStatusForm({
  id,
  status,
  children,
  className,
}: {
  id: string;
  status: WaitingStatus;
  children: React.ReactNode;
  className: string;
}) {
  const [state, action] = useActionState(submitWaitingStatusWithState, emptyActionState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className} pendingLabel="Mise à jour...">
        {children}
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
