const MENU_OPTIONS = `1. Get started, build my page for me 🚀
2. Talk to a real person`;

export const MAIN_MENU_TEXT = `Hi there! 👋 Welcome to DigitalFlyer — great to have you here.

${MENU_OPTIONS}

Reply with 1 or 2.`;

export const INVALID_SELECTION_TEXT = `Sorry, I didn't quite catch that. Please reply with 1 or 2:

${MENU_OPTIONS}`;

export const OPTION_4_ACK_TEXT = `Got it 😊 I'll get a member of our team to reach out to you directly shortly.`;

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

  return `Our Founding Nomad spots are full for now, but here's what's available:

${lines}

Reply with a number.`;
}

export function buildTierInvalidText(slotsRemaining: number): string {
  return `Sorry, please reply with one of the numbers shown.

${buildTierMenuText(slotsRemaining)}`;
}
