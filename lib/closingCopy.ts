export function buildPageLiveText(): string {
  const pageUrl = process.env.FACEBOOK_PAGE_URL ?? "(Facebook page link pending)";
  const groupUrl = process.env.FACEBOOK_GROUP_URL;

  const links = groupUrl
    ? `Facebook Page: ${pageUrl}\nFacebook Group: ${groupUrl}`
    : `Facebook Page: ${pageUrl}`;

  return `🎉 Great news — your page is now live!

Follow us here to stay in the loop:

${links}

Welcome to DigitalFlyer!`;
}
