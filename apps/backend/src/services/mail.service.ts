import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const mailService = {
  async sendMail({ to, subject, html, text }: SendMailParams) {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html
    });
  }
};
