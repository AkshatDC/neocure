import nodemailer from 'nodemailer';
import { env } from '../server/config/env.js';

// Placeholder notification service
// TODO: Configure SMTP or use SendGrid/Mailgun for production

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendEmail(params: { to: string; subject: string; text: string; html?: string }) {
  // TODO: Implement real email sending
  console.log('sendEmail called (stub):', params);
  
  if (!process.env.SMTP_USER) {
    console.warn('SMTP not configured, skipping email send');
    return { ok: true, mock: true };
  }

  // Uncomment when SMTP is configured:
  // await transporter.sendMail({ from: '"NeoCure" <noreply@neocure.com>', ...params });
  
  return { ok: true };
}

export async function sendReminderNotification(params: { userId: string; title: string; description?: string }) {
  // TODO: Fetch user email from DB and send reminder
  console.log('sendReminderNotification called (stub):', params);
  return { ok: true };
}
