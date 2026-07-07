import { PAYMENT_HEADER, withHeader } from "./sectionHeaders";
import { formatRand } from "./pricing";

export function buildPaymentIntroText(amountCents: number): string {
  return withHeader(
    PAYMENT_HEADER,
    `Thank you! Our team will get started as soon as payment is confirmed.

Your total comes to ${formatRand(amountCents)}. 💳

How would you like to pay?

1. EFT (bank transfer)
2. Pay Now (card, instant)`
  );
}

export const PAYMENT_METHOD_INVALID_TEXT = "Sorry, please reply with 1 or 2.";

export function buildEftDetailsText(businessName: string | null | undefined): string {
  const bankName = process.env.EFT_BANK_NAME ?? "Capitec Business";
  const accountName = process.env.EFT_ACCOUNT_NAME ?? "(account name pending)";
  const accountNumber = process.env.EFT_ACCOUNT_NUMBER ?? "(account number pending)";
  const branchCode = process.env.EFT_BRANCH_CODE ?? "(branch code pending)";

  return withHeader(
    PAYMENT_HEADER,
    `Please make an EFT payment to:

Bank: ${bankName}
Account name: ${accountName}
Account number: ${accountNumber}
Branch code: ${branchCode}
Reference: ${businessName ?? "your business name"}

Once done, please reply here with a photo or PDF of your proof of payment. 📎`
  );
}

export const EFT_AWAITING_PROOF_TEXT =
  "Just waiting on your proof of payment, please send a photo or PDF whenever you're ready. 😊";

export const EFT_PROOF_RECEIVED_TEXT =
  "Thanks for sending that through! 🙏 We're verifying your payment now, and someone from our team will message you shortly to confirm everything.";

export const PAY_NOW_CTA_BODY_TEXT = "Here's your secure payment link. Once paid, you'll get confirmation here automatically. 🎉";

export const PAY_NOW_CTA_BUTTON_TEXT = "Pay Now";

export const PAYMENT_INIT_FAILED_TEXT =
  "Sorry, something went wrong setting up your payment link. Our team will follow up shortly.";

export function buildPaymentConfirmedText(name: string | null | undefined): string {
  const greeting = name ? `Thank you so much, ${name}.` : "Thank you so much.";
  return `Payment confirmed! 🎉 ${greeting} Our team will have your page live within 24 to 48 hours, often sooner.`;
}
