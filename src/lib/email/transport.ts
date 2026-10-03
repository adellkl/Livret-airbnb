import 'server-only';
import nodemailer from 'nodemailer';
import { EMAIL_SENDER } from './config';
import { renderAccountEmail, type AccountEmailKind } from './templates';

let transport: ReturnType<typeof nodemailer.createTransport> | undefined;

export function requireGmailConfiguration() {
  if (!process.env.GMAIL_APP_PASSWORD?.trim()) throw new Error('email/gmail-not-configured');
}

export async function sendAccountEmail(to: string, kind: AccountEmailKind, actionUrl: string) {
  requireGmailConfiguration();
  transport ??= nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: EMAIL_SENDER.address, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, '') },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    disableFileAccess: true, disableUrlAccess: true,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  });
  const result = await transport.sendMail({
    from: EMAIL_SENDER, replyTo: EMAIL_SENDER, envelope: { from: EMAIL_SENDER.address, to: [to] },
    to: { address: to, name: '' }, ...renderAccountEmail(kind, actionUrl),
    headers: { 'X-Auto-Response-Suppress': 'All', 'Auto-Submitted': 'auto-generated' },
  });
  if (!result.accepted?.length) throw new Error('email/recipient-rejected');
  return result.messageId;
}
