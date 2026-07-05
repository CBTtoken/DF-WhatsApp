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
  return `${prompt}\n\n${lines}`;
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

// Business details only (see CLAUDE.md section 6, Data Model). Name, business name,
// and email are captured earlier (before the fork); how_heard is asked at the very end.
export const INTAKE_FIELDS: IntakeField[] = [
  {
    step: "intake_province",
    column: "province",
    question: buildChoiceQuestion("Now let's talk about your business. Which province are you based in?", PROVINCES),
    options: PROVINCES,
  },
  { step: "intake_industry", column: "industry", question: "Thanks! What industry or type of business is this?" },
  {
    step: "intake_business_address",
    column: "business_address",
    question:
      'What\'s your business address? This becomes the pin on your Google Maps listing, so people can get directions straight from your webpage. Reply "Online" if you don\'t have a physical location.',
  },
  {
    step: "intake_business_description",
    column: "business_description",
    question: "Tell me a bit more about your business, what you do, your services, and the areas you cover, in your own words.",
  },
  {
    step: "intake_tagline",
    column: "tagline",
    question: 'Got a tagline or slogan? Reply "skip" if not.',
  },
  {
    step: "intake_products_services",
    column: "products_services",
    question: "What are your main products or services?",
  },
  {
    step: "intake_business_story",
    column: "additional_notes",
    question: "Last one about the business, when did you get started, and what makes you stand out from others?",
  },
  {
    step: "intake_facebook_link",
    column: "facebook_link",
    question: 'Almost done! Got a Facebook page? Share the link, or reply "skip".',
  },
  {
    step: "intake_instagram_link",
    column: "instagram_link",
    question: 'How about Instagram? Share the link, or reply "skip".',
  },
  {
    step: "intake_existing_website",
    column: "existing_website",
    question: 'Last question here, do you already have a website? Share the link, or reply "none".',
  },
];

export const FIRST_INTAKE_FIELD = INTAKE_FIELDS[0];

export const INTAKE_COMPLETE_TEXT = "That's everything I need to get your profile ready! 🎉";

export function getIntakeField(step: string): IntakeField | undefined {
  return INTAKE_FIELDS.find((field) => field.step === step);
}

export function getNextIntakeField(step: string): IntakeField | undefined {
  const index = INTAKE_FIELDS.findIndex((field) => field.step === step);
  return index === -1 ? undefined : INTAKE_FIELDS[index + 1];
}

export function formatIntakeInvalid(field: IntakeField): string {
  return `Sorry, please reply with one of the numbers shown.\n\n${field.question}`;
}
