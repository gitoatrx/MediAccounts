import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function smtpSettings() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { host, port, secure: port === 465, auth: { user, pass } };
}

// EMAIL_MODE=auto (default) emails codes once SMTP settings exist and only
// prints them to the console until then. Use smtp or log to force either one.
export function emailMode() {
  const mode = (process.env.EMAIL_MODE ?? 'auto').trim().toLowerCase();
  if (mode === 'smtp' || mode === 'log') return mode;
  return smtpSettings() ? 'smtp' : 'log';
}

/** Checks the SMTP login once at startup so misconfiguration shows up in the server log. */
export async function verifyEmailDelivery() {
  const settings = smtpSettings();
  if (emailMode() !== 'smtp') {
    console.log('[MediAccounts email] SMTP is not configured; sign-in codes will be printed to this console.');
    return;
  }
  if (!settings) {
    console.error('[MediAccounts email] EMAIL_MODE=smtp but SMTP_HOST, SMTP_USER, or SMTP_PASS is missing.');
    return;
  }
  try {
    transporter ??= nodemailer.createTransport(settings);
    await transporter.verify();
    console.log(`[MediAccounts email] SMTP ready: sending sign-in codes as ${settings.auth.user} via ${settings.host}.`);
  } catch (error) {
    console.error('[MediAccounts email] SMTP login failed:', error instanceof Error ? error.message : error);
  }
}

export function isEmailDeliveryConfigured() {
  return emailMode() === 'log' || smtpSettings() !== null;
}

export async function sendLoginCodeEmail(to: string, code: string, expiresInMinutes: number) {
  if (emailMode() === 'log') {
    console.log(`[MediAccounts OTP] ${to}: ${code} (expires in ${expiresInMinutes} minutes)`);
    return;
  }
  const settings = smtpSettings();
  if (!settings) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be set when EMAIL_MODE=smtp.');
  transporter ??= nodemailer.createTransport(settings);
  const from = process.env.EMAIL_FROM?.trim() || `MediAccounts <${settings.auth.user}>`;
  await transporter.sendMail({
    from,
    to,
    subject: `${code} is your MediAccounts sign-in code`,
    text: `Your MediAccounts sign-in code is ${code}.\n\nIt expires in ${expiresInMinutes} minutes. If you did not try to sign in, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;color:#101A32;max-width:420px">
  <h2 style="margin:0 0 12px">Your MediAccounts sign-in code</h2>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
  <p style="color:#66748F">This code expires in ${expiresInMinutes} minutes. If you did not try to sign in, you can ignore this email.</p>
</div>`,
  });
}
