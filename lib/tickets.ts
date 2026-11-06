export const tickets = [
  { id: "early", name: "Early Bird", price: 800, note: "Limited-time online price" },
  { id: "general", name: "General Admission", price: 1000, note: "Standard festival entry" },
  { id: "senior", name: "Senior", price: 800, note: "For senior guests" },
] as const;

export type TicketId = (typeof tickets)[number]["id"];

export const MAX_PER_TYPE = 10;

export const DISCOUNT_CODES: Record<string, number> = {
  MCC10: 10,
};

export const DECLINE_TEST_CARD = "4000000000000002";

export function money(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function luhnValid(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let digit = Number(num[i]);
    if (dbl) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string) {
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6(011|5)/.test(num)) return "Discover";
  return "Card";
}

export type CardCheck =
  | { error: string }
  | { brand: string; last4: string; declined: boolean };

export function validateCard(input: {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}): CardCheck {
  const name = input.name.trim();
  const num = input.number.replace(/\D/g, "");
  const exp = input.expiry.trim();
  const cvc = input.cvc.trim();
  const brand = cardBrand(num);

  if (name.length < 2) return { error: "Please enter the name on the card." };
  if (num.length < 13 || num.length > 19 || !luhnValid(num)) {
    return { error: "Please enter a valid card number." };
  }

  const match = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) {
    return { error: "Please enter the expiry date as MM/YY." };
  }
  const expEnd = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  if (expEnd <= new Date()) return { error: "This card has expired." };

  const cvcLength = brand === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) {
    return { error: `Please enter the ${cvcLength}-digit CVC.` };
  }

  return { brand, last4: num.slice(-4), declined: num === DECLINE_TEST_CARD };
}
