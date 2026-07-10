const mailSender = require("../controllers/mailSender");
const emailVerificationTemplate = require("../mail/emailVerificationTemplate");

const isEmailConfigured = () => {
  const host = (process.env.MAIL_HOST || "").trim();
  const user = (process.env.MAIL_USER || "").trim();
  const pass = (process.env.MAIL_PASS || "").trim();
  return Boolean(host && user && pass);
};

const sendOtpEmail = async (email, otp) => {
  if (!isEmailConfigured()) {
    console.warn(
      `[dev] OTP for ${email}: ${otp}`,
      "\n→ Add MAIL_HOST, MAIL_USER, MAIL_PASS to server/.env (no spaces around =)."
    );
    return { sent: false, devOtp: otp };
  }

  try {
    await mailSender(
      email,
      "Your verification code — Impact Performance System",
      emailVerificationTemplate(otp)
    );
    console.log(`OTP email sent to ${email}`);
    return { sent: true };
  } catch (error) {
    console.warn(
      `[dev] OTP for ${email}: ${otp}`,
      `\n→ Email failed (${error.message}). Check MAIL_* in server/.env and your internet connection.`
    );
    return { sent: false, devOtp: otp, error: error.message };
  }
};

module.exports = {
  isEmailConfigured,
  sendOtpEmail
};
