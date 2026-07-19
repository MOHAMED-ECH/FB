"use client";

import { useActionState } from "react";
import {
  submitCancelAppointmentWithState,
  submitDeleteAppointmentWithState,
  submitNoShowAppointmentWithState,
} from "@/actions/appointments";
import { emptyActionState } from "@/lib/action-state";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

export function AppointmentActionForm({
  id,
  kind,
  className,
  children,
}: {
  id: string;
  kind: "cancel" | "delete" | "no-show";
  className: string;
  children: React.ReactNode;
}) {
  const actionFn =
    kind === "cancel"
      ? submitCancelAppointmentWithState
      : kind === "no-show"
        ? submitNoShowAppointmentWithState
        : submitDeleteAppointmentWithState;
  const [state, action] = useActionState(actionFn, emptyActionState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <SubmitButton className={className} pendingLabel="Traitement...">
        {children}
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
