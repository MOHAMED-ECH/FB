"use client";

import { ConsultationType } from "@prisma/client";
import { useActionState } from "react";
import { createAppointmentWithState } from "@/actions/appointments";
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

export function AppointmentForm({ patients }: { patients: PatientOption[] }) {
  const [state, action] = useActionState(createAppointmentWithState, emptyActionState);

  return (
    <form action={action} className={`${ui.card} grid gap-5 sm:grid-cols-2`}>
      <div className="sm:col-span-2">
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">Patient</label>
        <PatientCombobox patients={patients} placeholder="Saisir le nom, téléphone ou CIN" />
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">Date et heure</label>
        <input type="datetime-local" name="start" required className={ui.input} />
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">Durée</label>
        <input type="number" name="duration" defaultValue={30} min={5} step={5} className={ui.input} />
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">Type</label>
        <select name="type" className={ui.select}>
          <option value={ConsultationType.FIRST}>Première consultation</option>
          <option value={ConsultationType.CONTROL}>Contrôle</option>
          <option value={ConsultationType.OTHER}>Autre</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">Motif</label>
        <input name="motif" required className={ui.input} placeholder="Ex. céphalées, suivi EEG..." />
      </div>
      <div className="sm:col-span-2">
        <FormFeedback state={state} />
      </div>
      <SubmitButton className={`${ui.btnPrimary} sm:col-span-2`} pendingLabel="Enregistrement...">
        Enregistrer le rendez-vous
      </SubmitButton>
    </form>
  );
}
