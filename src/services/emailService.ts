import nodemailer from "nodemailer";
import { config } from "../config";
import { log, logger } from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendEmail(emailContent: any, subject: string) {
  try {
    const mailOptions = {
      from: config.smtp.user,
      to: config.recipientEmails,
      subject,
      html: emailContent,
    };
    await transporter.sendMail(mailOptions);
    logger.info("📧 Email sent successfully!");
  } catch (error) {
    log("❌ Error sending email", error);
  }
}
