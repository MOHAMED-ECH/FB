import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvoiceStatus } from "@prisma/client";
import {
  assertPaymentWithinRemaining,
  invoiceStatus,
  remainingInvoiceCents,
} from "./billing";

describe("billing", () => {
  it("computes invoice status from paid amount", () => {
    assert.equal(invoiceStatus(500, 0), InvoiceStatus.UNPAID);
    assert.equal(invoiceStatus(500, 250), InvoiceStatus.PARTIAL);
    assert.equal(invoiceStatus(500, 500), InvoiceStatus.PAID);
  });

  it("computes remaining amount in cents with decimal rounding", () => {
    assert.equal(remainingInvoiceCents(100.1, 40.05), 6005);
  });

  it("accepts a payment equal to the remaining amount", () => {
    assert.doesNotThrow(() => assertPaymentWithinRemaining(500, 200, 300));
  });

  it("rejects a payment above the remaining amount", () => {
    assert.throws(
      () => assertPaymentWithinRemaining(500, 200, 300.01),
      /depasser le reste/
    );
  });

  it("rejects payments on a settled invoice", () => {
    assert.throws(
      () => assertPaymentWithinRemaining(500, 500, 1),
      /deja soldee/
    );
  });
});
