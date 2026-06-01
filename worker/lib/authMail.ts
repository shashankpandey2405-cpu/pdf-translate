import { Resend } from "resend";
import type { Env } from "../env";
import { val } from "../env";

export async function sendPasswordResetEmail(env: Env, toEmail: string, resetUrl: string): Promise<void> {
  const apiKey = val(env.RESEND_API_KEY);
  const from = val(env.AUTH_EMAIL_FROM);

  if (!apiKey || !from) {
    console.warn("[auth] RESEND_API_KEY or AUTH_EMAIL_FROM missing; reset link (dev log only):", resetUrl);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: toEmail,
    subject: "Reset your PDFTrusted password",
    html: `
      <p>You requested a password reset for your PDFTrusted account.</p>
      <p><a href="${resetUrl}">Set a new password</a> (link expires in 1 hour).</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
  if (error) {
    console.error("[auth] Resend error:", error);
    throw new Error("Failed to send reset email");
  }
}
