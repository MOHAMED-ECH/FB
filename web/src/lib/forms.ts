import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null));

export const nonEmptyText = z.string().trim().min(1, "Champ obligatoire").max(500);

export const longText = z.string().trim().max(12000);

export const dateFromForm = z
  .string()
  .trim()
  .pipe(z.iso.date())
  .transform((value) => new Date(`${value}T00:00:00`));

export const dateTimeFromForm = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return date;
  });

export const optionalDateFromForm = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return date;
  });

export const optionalString = optionalText;

export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function checked(formData: FormData, key: string) {
  return formData.getAll(key).includes("true");
}
