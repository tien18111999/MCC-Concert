import { ValidationError } from "../errors/AppError";
import type { CardInput } from "../models/CheckoutRequest";
import { cardBrand, luhnValid } from "./cardUtils";

// Checks the shape of card details (not whether the bank accepts them).
export class CardValidator {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  validate(card: CardInput | null): { brand: string; last4: string } {
    if (!card) throw new ValidationError("Card details are required.");
    const { name, number, expiry, cvc } = card;
    const brand = cardBrand(number);

    if (name.length < 2) throw new ValidationError("Please enter the name on the card.");
    if (number.length < 13 || number.length > 19 || !luhnValid(number)) {
      throw new ValidationError("Please enter a valid card number.");
    }
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) {
      throw new ValidationError("Please enter the expiry date as MM/YY.");
    }
    if (new Date(2000 + Number(match[2]), Number(match[1]), 1) <= this.clock()) {
      throw new ValidationError("This card has expired.");
    }
    const cvcLength = brand === "Amex" ? 4 : 3;
    if (!new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) {
      throw new ValidationError(`Please enter the ${cvcLength}-digit CVC.`);
    }
    return { brand, last4: number.slice(-4) };
  }
}
