// One record per checkout attempt (approved or declined).
// Only the card brand and last 4 digits are kept: never the number, CVC or cardholder name.

export interface PaymentLine {
  ticketId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  gross: number;
  discountedQty: number;
  discount: number;
  net: number;
}

export type PaymentStatus = "Approved" | "Declined";

export interface PaymentData {
  orderId: string;
  transactionId: string;
  createdAt: string; // ISO string
  status: PaymentStatus;
  cardBrand: string; // Visa | Mastercard | Amex | Discover | Card | None
  cardLast4: string | null;
  lines: PaymentLine[];
  subtotal: number;
  discount: number;
  discountCode: string | null;
  discountedQty: number;
  donation: number;
  total: number;
  fee: number;
}

export interface Payment extends PaymentData {}

export class Payment {
  constructor(data: PaymentData) {
    Object.assign(this, data);
  }

  get isApproved() {
    return this.status === "Approved";
  }

  get ticketCount() {
    return this.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  toJSON(): PaymentData {
    return {
      orderId: this.orderId,
      transactionId: this.transactionId,
      createdAt: this.createdAt,
      status: this.status,
      cardBrand: this.cardBrand,
      cardLast4: this.cardLast4,
      lines: this.lines,
      subtotal: this.subtotal,
      discount: this.discount,
      discountCode: this.discountCode,
      discountedQty: this.discountedQty,
      donation: this.donation,
      total: this.total,
      fee: this.fee,
    };
  }

  static fromJSON(data: PaymentData) {
    return new Payment(data);
  }
}
