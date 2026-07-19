"use client";

import { useActionState } from "react";
import { createPaymentWithState } from "@/actions/payments";
import { emptyActionState } from "@/lib/action-state";
import { ui } from "@/lib/ui-classes";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

export function PaymentCollectionForm({
  patientId,
  consultationId,
  invoiceId,
  remainingAmount,
}: {
  patientId: string;
  consultationId: string;
  invoiceId: string;
  remainingAmount: number;
}) {
  const [state, action] = useActionState(createPaymentWithState, emptyActionState);

  return (
    <form action={action} className="mt-4 grid gap-3 border-t border-cabinet-border pt-4 sm:grid-cols-[1fr_150px_1fr_auto]">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="consultationId" value={consultationId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input
        type="number"
        step="0.01"
        min="0.01"
        max={remainingAmount}
        name="amount"
        defaultValue={remainingAmount.toFixed(2)}
        className={ui.input}
        aria-label="Montant à encaisser"
      />
      <select name="method" className={ui.select} aria-label="Mode de paiement">
        <option value="CASH">Espèces</option>
        <option value="CARD">Carte</option>
        <option value="CHEQUE">Chèque</option>
        <option value="TRANSFER">Virement</option>
      </select>
      <input name="note" placeholder="Note paiement" className={ui.input} />
      <SubmitButton className={ui.btnPrimary} pendingLabel="Encaissement...">
        Encaisser
      </SubmitButton>
      <div className="sm:col-span-4">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
