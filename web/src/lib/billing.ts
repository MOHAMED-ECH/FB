import { InvoiceStatus } from "@prisma/client";

export function invoiceStatus(expectedAmount: number, paidAmount: number) {
  if (paidAmount <= 0) return InvoiceStatus.UNPAID;
  if (paidAmount >= expectedAmount) return InvoiceStatus.PAID;
  return InvoiceStatus.PARTIAL;
}

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function remainingInvoiceCents(expectedAmount: number, paidAmount: number) {
  return toCents(expectedAmount) - toCents(paidAmount);
}

export function assertPaymentWithinRemaining(expectedAmount: number, paidAmount: number, paymentAmount: number) {
  const remainingCents = remainingInvoiceCents(expectedAmount, paidAmount);
  if (remainingCents <= 0) {
    throw new Error("Cette facture est deja soldee.");
  }
  if (toCents(paymentAmount) > remainingCents) {
    throw new Error(`Le paiement ne peut pas depasser le reste du de ${(remainingCents / 100).toFixed(2)} MAD.`);
  }
}
