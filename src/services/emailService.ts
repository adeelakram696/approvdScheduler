import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import { config } from "../config/config";
import { logger } from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendEmail(items: { name: string; details: string }[]) {
  try {
    const templateSource = fs.readFileSync("src/templates/emailTemplate.hbs", "utf8");
    const template = handlebars.compile(templateSource);
    const emailContent = template({ items });

    const mailOptions = {
      from: config.smtp.user,
      to: config.recipientEmail,
      subject: "Monday.com Weekly Report",
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    logger.info("📧 Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email", error);
  }
}
