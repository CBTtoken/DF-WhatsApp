import { formatRand } from "./pricing";

export function buildPaymentMethodPromptText(amountCents: number): string {
  return `Your total comes to ${formatRand(amountCents)}. 💳

How would you like to pay?

1. EFT (bank transfer)
2. Pay Now (card, instant)

Reply with 1 or 2.`;
}

export const PAYMENT_METHOD_INVALID_TEXT = "Sorry, please reply with 1 or 2.";

export function buildEftDetailsText(businessName: string | null | undefined): string {
  const bankName = process.env.EFT_BANK_NAME ?? "Capitec Business";
  const accountName = process.env.EFT_ACCOUNT_NAME ?? "(account name pending)";
  const accountNumber = process.env.EFT_ACCOUNT_NUMBER ?? "(account number pending)";
  const branchCode = process.env.EFT_BRANCH_CODE ?? "(branch code pending)";

  return `Please make an EFT payment to:

Bank: ${bankName}
Account name: ${accountName}
Account number: ${accountNumber}
Branch code: ${branchCode}
Reference: ${businessName ?? "your business name"}

Once done, please reply here with a photo or PDF of your proof of payment.`;
}

export const EFT_AWAITING_PROOF_TEXT =
  "Just waiting on your proof of payment — please send a photo or PDF whenever you're ready.";

export const EFT_PROOF_RECEIVED_TEXT =
  "Thanks for sending that through! 🙏 We're verifying your payment now, and someone from our team will message you shortly to confirm everything.";

export function buildPayNowLinkText(authorizationUrl: string): string {
  return `Here's your secure payment link: ${authorizationUrl}

Once paid, you'll get a confirmation here automatically.`;
}

export const PAY_NOW_CLOSING_TEXT =
  "Perfect, thank you! 🎉 Once your payment goes through, you'll get an automatic confirmation right here.";

export const PAYMENT_INIT_FAILED_TEXT =
  "Sorry, something went wrong setting up your payment link. Our team will follow up shortly.";

export const PAYMENT_CONFIRMED_TEXT =
  "Payment confirmed! 🎉 Thank you — our team will have your page live within 24 hours.";
