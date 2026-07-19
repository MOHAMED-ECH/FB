"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadMedicalDocument, type UploadMedicalDocumentState } from "@/actions/documents";
import { ui } from "@/lib/ui-classes";

const initialState: UploadMedicalDocumentState = { ok: false };
const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
const maxFileSize = 15 * 1024 * 1024;

function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isAllowedFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

export function DocumentUploadForm({ patientId }: { patientId: string }) {
  const [state, action] = useActionState(uploadMedicalDocument, initialState);
  const [clientError, setClientError] = useState("");
  const [dismissedServerMessageKey, setDismissedServerMessageKey] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultExamDate = todayInputValue();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  const rawServerMessage = state.error || state.message || "";
  const dismissServerMessage = Boolean(rawServerMessage) && dismissedServerMessageKey === rawServerMessage;
  const serverMessage = dismissServerMessage ? "" : rawServerMessage;
  const visibleMessage = clientError || serverMessage;
  const isErrorMessage = Boolean(clientError || (!dismissServerMessage && state.error));

  useEffect(() => {
    if (!visibleMessage) return;

    const timer = window.setTimeout(() => {
      setClientError("");
      setDismissedServerMessageKey(rawServerMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [rawServerMessage, visibleMessage]);

  function clearUploadFeedback() {
    setClientError("");
    setDismissedServerMessageKey(rawServerMessage);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded-md border border-cabinet-border bg-cabinet-cream/45 p-5">
      <input type="hidden" name="patientId" value={patientId} />
      <div>
        <p className="text-sm font-semibold text-cabinet-primary-dark">Ajouter un examen</p>
        <p className="mt-1 text-xs leading-5 text-cabinet-muted">Formats acceptés : PDF, PNG, JPG ou JPEG. Taille maximale : 15 Mo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select name="docType" className={ui.select}>
            <option>IRM</option>
            <option>Scanner</option>
            <option>EEG</option>
            <option>ENMG</option>
            <option>PEV</option>
            <option>Autre</option>
          </select>
        </Field>
        <Field label="Date examen"><input type="date" name="examDate" defaultValue={defaultExamDate} className={ui.input} /></Field>
      </div>
      <Field label="Titre"><input name="title" placeholder="Ex. IRM cérébrale avec injection" className={ui.input} /></Field>
      <Field label="Fichier">
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          required
          aria-invalid={isErrorMessage}
          aria-describedby="document-upload-message"
          onChange={(event) => {
            setDismissedServerMessageKey("");
            const file = event.target.files?.[0];
            if (!file) {
              setClientError("");
              return;
            }
            if (!isAllowedFile(file)) {
              setClientError("Format non autorisé. Choisissez un fichier PDF, PNG, JPG ou JPEG.");
              return;
            }
            if (file.size > maxFileSize) {
              setClientError("Le fichier dépasse 15 Mo. Choisissez un fichier plus léger.");
              return;
            }
            setClientError("");
          }}
          className="block w-full rounded-md border border-dashed border-cabinet-border bg-cabinet-card px-4 py-4 text-sm text-cabinet-muted file:mr-4 file:rounded-md file:border-0 file:bg-cabinet-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-cabinet-secondary focus:border-cabinet-secondary focus:outline-none focus:ring-4 focus:ring-cabinet-secondary/15"
        />
      </Field>
      {visibleMessage && (
        <div
          id="document-upload-message"
          className={`flex flex-col gap-3 rounded-md border px-4 py-3 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between ${
            isErrorMessage
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <p>{visibleMessage}</p>
          <button
            type="button"
            onClick={clearUploadFeedback}
            className={`w-fit rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              isErrorMessage
                ? "border-red-200 bg-white text-red-800 hover:bg-red-100"
                : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Fermer
          </button>
        </div>
      )}
      <UploadSubmitButton disabled={Boolean(clientError)} />
    </form>
  );
}

function UploadSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={`${ui.btnPrimary} w-fit disabled:cursor-not-allowed disabled:opacity-55`}>
      {pending ? "Téléversement..." : "Téléverser le document"}
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
