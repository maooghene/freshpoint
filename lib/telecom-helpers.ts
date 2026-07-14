// lib/telecom-helpers.ts

/**
 * Strict validation regex checking active prefixes for Nigerian telco profiles:
 * MTN, Airtel, Glo, 9mobile, and newer data providers.
 */
export const NIGERIAN_E164_REGEX =
  /^(234)(701|702|703|704|705|706|707|708|709|802|803|804|805|806|807|808|809|901|902|903|904|905|906|907|908|909|911|912|913|915|916)\d{7}$/;

/**
 * Normalizes localized input sequences into a clean, database-safe E.164 string.
 * Supports standard local 11-digit strings, +234 prefixes, or raw country entries.
 */
export function normalizeToE164(input: string): {
  normalized: string;
  isValid: boolean;
} {
  let digits = input.replace(/\D/g, ""); // Strip non-numeric artifacts

  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.substring(1);
  } else if (digits.length === 10 && !digits.startsWith("234")) {
    digits = "234" + digits;
  }

  const isValid = NIGERIAN_E164_REGEX.test(digits);
  return { normalized: digits, isValid };
}
