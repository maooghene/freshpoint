export const CONTACT_INFO = {
  supportEmail: "freshpointapp.ng@gmail.com",
  replyTime: "within one business day",
};

/** mailto: link with a pre-filled subject, for places that link straight to email. */
export function supportMailto(subject = "FreshPoint Support Request"): string {
  return `mailto:${CONTACT_INFO.supportEmail}?subject=${encodeURIComponent(subject)}`;
}
