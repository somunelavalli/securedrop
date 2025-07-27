import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommandInput } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// Create SES client
const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Create Nodemailer transporter using SES
const transporter = nodemailer.createTransport({
  SES: { ses } as any, // workaround for type mismatch
});

// Send email function
export const sendDownloadNotification = async (recipient: string, fileName: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: '"SecureDrop" <noreply@securedrop.io>', // Must be verified in SES
      to: recipient,
      subject: 'File Downloaded',
      html: `<p>Your file <strong>${fileName}</strong> has been downloaded.</p>`
    //text: `Your file "${fileName}" has been downloaded.`,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
