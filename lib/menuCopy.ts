const MENU_OPTIONS = `1. FAQ, quick answers
2. More info, who we are
3. Pricing and what's included
4. Get started, build my page for me
5. Talk to a real person`;

export function buildGreetingText(firstName: string): string {
  return `Welcome to DigitalFlyer SA! 👋 Hi ${firstName}, so glad you're here.

Quick tips: type *menu* anytime to jump back here, or *human* if you'd like to speak to a real person, we'll pick up right where you left off once you're ready.

${MENU_OPTIONS}

Just reply with a number.`;
}

export const MENU_OPTIONS_TEXT = `${MENU_OPTIONS}\n\nJust reply with a number.`;

export const INVALID_SELECTION_TEXT = "Sorry, I didn't quite catch that. Please reply with a number, 1 to 5.";

export const FAQ_TEXT = `*How much does it cost?*
Just the DigitalFlyer webpage is R1,199 for the year if you build it yourself, or R1,599 for the year if you'd like our team to build it for you. No monthly fees, no hidden extras.`;

export const MORE_INFO_TEXT =
  "We're DigitalFlyer! We build small businesses a professional webpage, complete with eCommerce, WhatsApp integration, booking, a Google Maps listing, and marketplace presence. All done for you, so you can focus on running your business.";

export const PRICING_TEXT = `Here's how pricing works.

*Just want your DigitalFlyer webpage?*
DIY, build it yourself, R1,199 for the year
Done for you, our team builds it for you, R1,599 for the year
No monthly fees, no hidden extras, valid for a full year.

*Want the full RE:Biz Nomads experience?*
Webpage plus community, a Deal Room, WhatsApp group, and monthly founder sessions.
Founding member pricing, R750 for the year, locked in for life, only 100 spots.
Once those spots are filled, R1,500 for the year.
Payable upfront for the year, no other fees.

Ready to get started? Reply *4*.`;

export const SUPPORT_NUMBER = "0723110570";

export const HANDOFF_ACK_TEXT = `Got it 😊 I'll get a member of our team to reach out to you directly shortly. If they take a while, you can message them directly at ${SUPPORT_NUMBER}.`;

// We only find out someone asked for help when we next check the inbox, so every
// hand-off message repeats the direct number, giving them a way to reach us that
// doesn't depend on us noticing in time.
export const HELP_MIDFLOW_TEXT = `No problem, I'll get a real person to help you out. 🙋 If it's urgent, you can message our team directly on ${SUPPORT_NUMBER}. Once you're sorted, just type *continue* and we'll pick up right where you left off.`;

export const HANDOFF_WAITING_TEXT = `You're currently waiting on a member of our team to help you out. If it's urgent, you can message them directly on ${SUPPORT_NUMBER}. Type *continue* once you're ready to pick back up, or *restart* to start over.`;

export const FORK_TEXT = `Just one more thing before we get into the details 😊 Do you want just your DigitalFlyer webpage, or the full RE:Biz Nomads experience?

1. Just my DigitalFlyer webpage
2. RE:Biz Nomads, webpage plus community`;

export const FORK_INVALID_TEXT = `Sorry, please reply with 1 or 2.

${FORK_TEXT}`;

export const DF_TYPE_TEXT = `Got it! 👍 Would you like to build it yourself, or have our team build it for you?

1. DIY, R1,199 for the year
2. Done for you, R1,599 for the year`;

export const DF_TYPE_INVALID_TEXT = `Sorry, please reply with 1 or 2.

${DF_TYPE_TEXT}`;

export function buildReBizTierAckText(slotsRemaining: number): string {
  if (slotsRemaining > 0) {
    return "Amazing choice! You're in as a *Founding Nomad*, R750 for the year, locked in for life. 🎉";
  }
  return "Amazing choice! RE:Biz Nomads membership is R1,500 for the year.";
}

export const RETURNING_CUSTOMER_TEXT = `Thank you for your message! 😊 We've noticed your page is already active, but if you'd like to speak to someone, please message ${SUPPORT_NUMBER} and our team will assist.`;

export function buildMenuNavigatedText(): string {
  return `No problem! Here's the main menu, your progress is saved, just type *continue* anytime to pick back up.

${MENU_OPTIONS_TEXT}`;
}
