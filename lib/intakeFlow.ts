export type IntakeField = {
  step: string;
  column: string;
  question: string;
  // When set, the reply is expected to be a number mapping to one of these values
  // (e.g. province), rather than free text.
  options?: string[];
};

function buildChoiceQuestion(prompt: string, options: string[]): string {
  const lines = options.map((option, index) => `${index + 1}. ${option}`).join("\n");
  return `${prompt}\n\n${lines}\n\nReply with a number.`;
}

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

// Business details only (see CLAUDE.md section 6, Data Model). DF username/password,
// payment, and how_heard (asked at the very end) are handled elsewhere.
export const INTAKE_FIELDS: IntakeField[] = [
  { step: "intake_full_name", column: "full_name", question: "What's your full name?" },
  { step: "intake_business_name", column: "business_name", question: "What's the name of your business?" },
  { step: "intake_email", column: "email", question: "What's the best email address to reach you on?" },
  {
    step: "intake_province",
    column: "province",
    question: buildChoiceQuestion("Which province is your business based in?", PROVINCES),
    options: PROVINCES,
  },
  { step: "intake_industry", column: "industry", question: "What industry or type of business is this?" },
  {
    step: "intake_business_address",
    column: "business_address",
    question: 'What\'s your business address? (Reply "Online" if you don\'t have a physical location.)',
  },
  {
    step: "intake_business_description",
    column: "business_description",
    question:
      "Please tell us a bit more about your business — what you do, specific services, areas, or products.",
  },
  {
    step: "intake_tagline",
    column: "tagline",
    question: 'Do you have a tagline or slogan? (Reply "skip" if not.)',
  },
  {
    step: "intake_products_services",
    column: "products_services",
    question: "What are your main products or services?",
  },
  {
    step: "intake_business_story",
    column: "additional_notes",
    question:
      "One last thing about your business — when did you start, and what makes you great or unique compared to others?",
  },
  {
    step: "intake_facebook_link",
    column: "facebook_link",
    question: 'Do you have a Facebook page? Share the link, or reply "skip".',
  },
  {
    step: "intake_instagram_link",
    column: "instagram_link",
    question: 'Do you have an Instagram page? Share the link, or reply "skip".',
  },
  {
    step: "intake_existing_website",
    column: "existing_website",
    question: 'Do you already have a website? Share the link, or reply "none".',
  },
];

export const FIRST_INTAKE_FIELD = INTAKE_FIELDS[0];

export const INTAKE_COMPLETE_TEXT = "Awesome, that's everything I need for your profile! 🎉";

export function getIntakeField(step: string): IntakeField | undefined {
  return INTAKE_FIELDS.find((field) => field.step === step);
}

export function getNextIntakeField(step: string): IntakeField | undefined {
  const index = INTAKE_FIELDS.findIndex((field) => field.step === step);
  return index === -1 ? undefined : INTAKE_FIELDS[index + 1];
}

export function formatIntakeQuestion(field: IntakeField): string {
  const index = INTAKE_FIELDS.findIndex((f) => f.step === field.step);
  const stepNumber = index + 1;
  const total = INTAKE_FIELDS.length;
  const opener = stepNumber === 1 ? "Great, let's get started!" : "Thanks!";

  return `${opener} Step ${stepNumber} of ${total} — ${field.question}`;
}

export function formatIntakeInvalid(field: IntakeField): string {
  return `Sorry, please reply with one of the numbers shown.\n\n${formatIntakeQuestion(field)}`;
}
