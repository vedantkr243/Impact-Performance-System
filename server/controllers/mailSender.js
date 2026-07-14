require("dotenv").config();
const nodemailer = require("nodemailer");

const readMailConfig = () => {
  const host = (process.env.MAIL_HOST || "").trim();
  const user = (process.env.MAIL_USER || "").trim();
  const rawPass = (process.env.MAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  return { host, user, pass };
};

const mailSender = async (email, title, body) => {
  const { host, user, pass } = readMailConfig();

  if (!host || !user || !pass) {
    throw new Error("Email is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASS in server/.env");
  }

  const PORT = Number(process.env.MAIL_PORT) || 587;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: PORT=== 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  const from =
    (process.env.MAIL_FROM || "").trim() || `"Impact Performance System" <${user}>`;

  const info = await transporter.sendMail({
    from,
    to: email,
    subject: title,
    html: body
  });

  console.log("Email sent:", info.messageId);
  return info;
};

module.exports = mailSender;
