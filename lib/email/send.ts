import { Resend } from "resend";
import type { ReactElement } from "react";

// ── Sender address ────────────────────────────────────────────────────────────
// Using Resend's shared test sender while in development.
// TODO: once veeral.com is verified in Resend (Dashboard → Domains → Add Domain),
//       change this to: 'Veeral <hello@veeral.com>'
const FROM = "Veeral <onboarding@resend.dev>";

// Lazily initialised — safe to import in files that might run without the key
// (e.g. during static build).  Actual sends will warn and no-op if key is missing.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// ── Public payload type ───────────────────────────────────────────────────────
export interface EmailPayload {
  /** Recipient email address */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /**
   * A React Email component rendered to HTML by Resend.
   * Pass as a function call, e.g. createElement(MyTemplate, props)
   * or <MyTemplate {...props} /> in a .tsx file.
   */
  react: ReactElement;
}

// ── Core send function ────────────────────────────────────────────────────────
/**
 * Send a branded Veeral transactional email via Resend.
 *
 * Gracefully no-ops (with a console warning) if RESEND_API_KEY is not set,
 * so the app never hard-crashes in environments without the key configured.
 *
 * @example
 * import { createElement } from "react";
 * import { sendEmail } from "@/lib/email/send";
 * import BuyerReceipt from "@/lib/email/templates/BuyerReceipt";
 *
 * await sendEmail({
 *   to: "buyer@example.com",
 *   subject: `Your Veeral receipt — Order #${shortId}`,
 *   react: createElement(BuyerReceipt, { orderId, itemTitle, ... }),
 * });
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[veeral/email] RESEND_API_KEY is not set — email skipped.",
      { to: payload.to, subject: payload.subject }
    );
    return;
  }

  const { error } = await getResend().emails.send({
    from: FROM,
    ...payload,
  });

  if (error) {
    // Log but don't throw — a failed email should never break the order flow.
    console.error("[veeral/email] Send failed:", error);
  } else {
    console.log("[veeral/email] Sent:", { to: payload.to, subject: payload.subject });
  }
}
