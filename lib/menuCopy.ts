const MENU_OPTIONS = `1. What is DigitalFlyer and how does it help my business?
2. Pricing and what's included.
3. Get started, build my page for me.
4. Talk to a real person.`;

const MENU_OPTIONS_HIGHLIGHT_3 = `1. What is DigitalFlyer and how does it help my business?
2. Pricing and what's included.
3. Get started, build my page for me. (most popular next step)
4. Talk to a real person.`;

export const MAIN_MENU_TEXT = `Welcome to DigitalFlyer! I can help you get your business online.

${MENU_OPTIONS}

Reply with a number (1-4).`;

export const INVALID_SELECTION_TEXT = `Sorry, I didn't catch that. Please reply with a number (1-4):

${MENU_OPTIONS}`;

export const OPTION_1_TEXT = `DigitalFlyer builds you a professional webpage, plus eCommerce, WhatsApp integration, booking, a Google Maps listing, and marketplace presence — all managed for you.

${MENU_OPTIONS_HIGHLIGHT_3}

Reply with a number (1-4).`;

export const OPTION_2_TEXT = `Here's our pricing:

- DigitalFlyer membership: R1,199/year (about R100/month)
- Done For You setup: R1,599 once-off
- RE:Biz Nomads: Founding Nomad R750/year (first 100 members only, locked rate), or Nomad Standard R1,500/year (or R500/quarter)

${MENU_OPTIONS_HIGHLIGHT_3}

Reply with a number (1-4).`;

export const OPTION_4_ACK_TEXT = `Got it — I'll get a member of our team to reach out to you directly.`;

export function buildForkMenuText(slotsRemaining: number): string {
  return `Great, let's get your page built! Most new members join as RE:Biz Nomads — same professional webpage, plus the community: a Deal Room, WhatsApp group, and monthly founder sessions. Founding Nomad pricing is locked for the first 100 members and ${slotsRemaining} spot${slotsRemaining === 1 ? "" : "s"} left.

1. Join RE:Biz Nomads
2. Just the webpage, DigitalFlyer only

Reply with 1 or 2.`;
}

export function buildForkInvalidText(slotsRemaining: number): string {
  return `Sorry, please reply with 1 or 2.

${buildForkMenuText(slotsRemaining)}`;
}

export type TierOption = { label: string; value: string };

export function buildTierOptions(slotsRemaining: number): TierOption[] {
  const options: TierOption[] = [];

  if (slotsRemaining > 0) {
    options.push({
      label: `Founding Nomad — R750/year, locked rate (${slotsRemaining} of 100 spots left)`,
      value: "founding_nomad",
    });
  }

  options.push({ label: "Nomad Standard — R1,500/year", value: "nomad_standard_annual" });
  options.push({ label: "Nomad Standard — R500/quarter instalment", value: "nomad_standard_quarterly" });

  return options;
}

export function buildTierMenuText(slotsRemaining: number): string {
  const options = buildTierOptions(slotsRemaining);
  const lines = options.map((option, index) => `${index + 1}. ${option.label}`).join("\n");

  return `Which RE:Biz Nomads tier would you like?

${lines}

Reply with a number.`;
}

export function buildTierInvalidText(slotsRemaining: number): string {
  return `Sorry, please reply with one of the numbers shown.

${buildTierMenuText(slotsRemaining)}`;
}
