import { randomHex } from "../utils";
import type { PaymentProcessor } from "./PaymentProcessor";

const DECLINE_TEST_CARD = "4000000000000002"; // always declined, to demo a failed payment

// Demo processor: approves everything except the decline test card. No real charge is made.
export class MockCardProcessor implements PaymentProcessor {
  async charge({ card }: Parameters<PaymentProcessor["charge"]>[0]) {
    return { approved: card.number !== DECLINE_TEST_CARD, transactionId: "txn_" + randomHex(8) };
  }
}
