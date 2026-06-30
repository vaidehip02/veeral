// Detects contact info that could enable off-platform transactions.
// Runs server-side only — cannot be bypassed by the client.

const PATTERNS: { name: string; regex: RegExp }[] = [
  // Email addresses
  { name: "email address", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i },

  // Phone numbers — various formats: +1 (555) 555-5555, 555.555.5555, etc.
  { name: "phone number", regex: /(\+?\d[\s\-.]?)?(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})/i },

  // URLs / websites
  { name: "website link", regex: /https?:\/\/[^\s]+|www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/i },

  // Instagram handles (@username)
  { name: "Instagram handle", regex: /(^|[\s,])@[a-zA-Z0-9._]{1,30}/i },

  // WhatsApp / Telegram / Signal / Snapchat mentions
  { name: "messaging app", regex: /\b(whatsapp|telegram|signal|snapchat|wechat|viber)\b/i },

  // "DM me", "text me", "call me", "email me" prompts
  { name: "off-platform contact request", regex: /\b(dm\s+me|text\s+me|call\s+me|email\s+me|reach\s+me|contact\s+me|message\s+me\s+on|find\s+me\s+on|hit\s+me\s+up)\b/i },

  // Venmo / PayPal / CashApp / Zelle
  { name: "payment app", regex: /\b(venmo|paypal|cashapp|cash\s+app|zelle|gpay|google\s+pay|apple\s+pay)\b/i },
];

export interface FilterResult {
  blocked: boolean;
  reason?: string;
}

export function filterMessageContent(body: string): FilterResult {
  for (const { name, regex } of PATTERNS) {
    if (regex.test(body)) {
      return {
        blocked: true,
        reason: `Messages cannot contain ${name}s. All transactions must stay on Veeral.`,
      };
    }
  }
  return { blocked: false };
}
