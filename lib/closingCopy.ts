export const PAGE_LIVE_INTRO_TEXT =
  "🎉 Great news, your page is now live! Follow us here to stay in the loop.";

export const FACEBOOK_PAGE_BUTTON_TEXT = "Follow our Page";

export const FACEBOOK_GROUP_BUTTON_TEXT = "Join our Group";

export function getFacebookPageUrl(): string | undefined {
  return process.env.FACEBOOK_PAGE_URL;
}

export function getFacebookGroupUrl(): string | undefined {
  return process.env.FACEBOOK_GROUP_URL;
}
