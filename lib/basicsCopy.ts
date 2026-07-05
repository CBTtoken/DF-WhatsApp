export const GET_STARTED_INTRO_AND_NAME_QUESTION =
  "Great, let's get your page started! First, a few quick basics.\n\nWhat's your full name?";

export function buildBusinessNameQuestion(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  return `Thanks ${firstName}! And what's the name of your business?`;
}

export const EMAIL_QUESTION =
  "Perfect. What's the best email to reach you on? We'll also use this for any updates on your page.";
