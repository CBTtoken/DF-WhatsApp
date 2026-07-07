import { GETTING_STARTED_HEADER, withHeader } from "./sectionHeaders";

export const GET_STARTED_INTRO_AND_NAME_QUESTION = withHeader(
  GETTING_STARTED_HEADER,
  "Great, let's get your page started! First, a few quick basics.\n\nWhat's your full name?"
);

export function buildBusinessNameQuestion(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  return withHeader(GETTING_STARTED_HEADER, `Thanks ${firstName}! And what's the name of your business?`);
}

export const EMAIL_QUESTION = withHeader(
  GETTING_STARTED_HEADER,
  "Perfect. What's the best email to reach you on? We'll also use this for any updates on your page."
);

export const EMAIL_INVALID_TEXT = withHeader(
  GETTING_STARTED_HEADER,
  "Hmm, that doesn't quite look like a valid email 🤔 Mind double-checking the spelling and sending it again?"
);

export function buildCellNumberConfirmQuestion(localNumber: string): string {
  return withHeader(
    GETTING_STARTED_HEADER,
    `Quick check: is *${localNumber}* the best cell/WhatsApp number to show on your webpage? Reply *yes* or *no*.`
  );
}

export const CELL_NUMBER_CONFIRM_INVALID_TEXT = withHeader(
  GETTING_STARTED_HEADER,
  'Just reply *yes* or *no* so I know which cell number to use.'
);

export const CELL_NUMBER_QUESTION = withHeader(
  GETTING_STARTED_HEADER,
  "No problem, what's the correct cell number then? Just the 10 digits, like 0723110570."
);

export const CELL_NUMBER_INVALID_TEXT = withHeader(
  GETTING_STARTED_HEADER,
  "That doesn't look like a valid cell number, please make sure it's 10 digits, like 0723110570."
);
