export const REGISTRATION_CTA_BODY_TEXT =
  "Next, let's get you set up on the DigitalFlyer platform. Once you're registered, just reply here and I'll grab your login details so our team can get started.";

export const REGISTRATION_CTA_BUTTON_TEXT = "Register Now";

export function getRegistrationUrl(): string {
  return process.env.DF_REGISTRATION_URL ?? "https://www.digitalflyer.co.za/register";
}

export const REGISTRATION_USERNAME_QUESTION = "What's the email address you registered with?";

export const REGISTRATION_PASSWORD_QUESTION =
  "And the password you set for that account?\n\nDon't worry, you can change it once we're done with setup and you take over :-)";
