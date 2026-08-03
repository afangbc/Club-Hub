export async function sendSchoolVerification(email: string, code: string): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["CLUBHUB_FROM_EMAIL"];
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and CLUBHUB_FROM_EMAIL.");
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
      subject: "Your ClubHub school verification code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h1>Verify your school</h1><p>Enter this code in ClubHub:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Email provider rejected the message (${response.status}).`);
}
