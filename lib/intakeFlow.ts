export type IntakeField = {
  step: string;
  column: string;
  question: string;
};

// Business details only (see CLAUDE.md section 6, Data Model). DF username/password
// and payment are collected later, not part of this guided intake.
export const INTAKE_FIELDS: IntakeField[] = [
  { step: "intake_how_heard", column: "how_heard", question: "How did you hear about DigitalFlyer?" },
  { step: "intake_full_name", column: "full_name", question: "What's your full name?" },
  { step: "intake_business_name", column: "business_name", question: "What's the name of your business?" },
  { step: "intake_email", column: "email", question: "What's the best email address to reach you on?" },
  { step: "intake_province", column: "province", question: "Which province are you based in?" },
  { step: "intake_industry", column: "industry", question: "What industry or type of business is this?" },
  {
    step: "intake_business_address",
    column: "business_address",
    question: 'What\'s your business address? (Reply "Online" if you don\'t have a physical location.)',
  },
  {
    step: "intake_business_description",
    column: "business_description",
    question: "In a sentence or two, what does your business do?",
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

export const INTAKE_COMPLETE_TEXT = "Thanks, that's everything I need for now!";

export function getIntakeField(step: string): IntakeField | undefined {
  return INTAKE_FIELDS.find((field) => field.step === step);
}

export function getNextIntakeField(step: string): IntakeField | undefined {
  const index = INTAKE_FIELDS.findIndex((field) => field.step === step);
  return index === -1 ? undefined : INTAKE_FIELDS[index + 1];
}
