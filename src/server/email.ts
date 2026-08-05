/**
 * Outbound mail. Production goes through Resend; local development prints the
 * code to the server console so you can sign up without an API key.
 *
 * The console fallback is deliberately refused in production — a deployment
 * that can't send mail should fail loudly at sign-up rather than quietly let
 * anyone verify an address they don't own.
 */

const isProduction = process.env["NODE_ENV"] === "production";

export function emailConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["CLUBHUB_FROM_EMAIL"]);
}

/** True when codes are printed to the server log instead of mailed. */
export function emailInConsoleMode(): boolean {
  return !emailConfigured() && !isProduction;
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["CLUBHUB_FROM_EMAIL"];

  if (!apiKey || !from) {
    if (isProduction) {
      throw new Error(
        "Email delivery is not configured. Set RESEND_API_KEY and CLUBHUB_FROM_EMAIL.",
      );
    }
    console.info(
      `\n[clubhub] ─────────────────────────────────────────────\n` +
        `[clubhub]  Verification code for ${email}: ${code}\n` +
        `[clubhub]  (dev only — set RESEND_API_KEY to send real mail)\n` +
        `[clubhub] ─────────────────────────────────────────────\n`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ClubHub/1.0",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your ClubHub verification code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h1>Confirm your email</h1><p>Enter this code in ClubHub to finish setting up your account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you didn't sign up for ClubHub, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Email provider rejected the message (${response.status}).`);
}
