export function buildRegistrationPromptText(): string {
  const url = process.env.DF_REGISTRATION_URL ?? "(registration link pending)";

  return `Next, please register on the DigitalFlyer platform here: ${url}

Once you've registered, reply here to let me know and I'll grab your login details so our team can build your page.`;
}

export const REGISTRATION_USERNAME_QUESTION = "What's the email address you registered with?";

export const REGISTRATION_PASSWORD_QUESTION = "And the password you set for that account?";

export const REGISTRATION_COMPLETE_TEXT =
  "Thank you for your information, our team will start as soon as the confirmation of payment is received, simply click on the link in the next message. 😊";
