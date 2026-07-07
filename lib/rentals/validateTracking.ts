/**
 * Validates a shipping tracking number against known carrier formats.
 * Returns { valid: true } or { valid: false, error: string }.
 *
 * Supported carriers and patterns:
 *   UPS      — 1Z followed by 16 alphanumeric chars (18 total)
 *   USPS     — 20–22 digits; or 13-char international (LL999999999LL)
 *   FedEx    — 12, 15, 20, or 22 digits
 *   DHL      — 10 digits
 */
export function validateTrackingNumber(raw: string): { valid: boolean; error?: string } {
  const s = raw.trim().replace(/[\s-]/g, "").toUpperCase();

  if (!s) return { valid: false, error: "Tracking number is required." };
  if (s.length < 10) return { valid: false, error: "Tracking number is too short — check for typos." };

  const UPS          = /^1Z[A-Z0-9]{16}$/;
  const USPS_DOM     = /^\d{20,22}$/;
  const USPS_INTL    = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
  const FEDEX        = /^\d{12}$|^\d{15}$|^\d{20}$|^\d{22}$/;
  const DHL          = /^\d{10}$/;

  const matched =
    UPS.test(s) ||
    USPS_DOM.test(s) ||
    USPS_INTL.test(s) ||
    FEDEX.test(s) ||
    DHL.test(s);

  if (!matched) {
    return {
      valid: false,
      error:
        "This doesn't match a known tracking format. Copy it directly from your carrier receipt — UPS starts with 1Z, USPS/FedEx are 12–22 digits.",
    };
  }

  return { valid: true };
}
