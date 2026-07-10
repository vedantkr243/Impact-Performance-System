const otpGenerator = require("otp-generator");

const ApiError = require("../utils/api-error");
const { isUsingMemoryStore } = require("../config/database");
const memoryStore = require("../dev/memoryStore");
const { sendOtpEmail } = require("../utils/sendOtpEmail");
const OTP = require("../models/OTP");

const normalizeEmail = (email) => email.toLowerCase().trim();

const sendOtp = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  });
console.log(otp);
  console.log('[debug] sendOtp for', normalizedEmail);

  if (isUsingMemoryStore()) {
    console.log('[debug] using memory store for OTP');
    memoryStore.setOtp(normalizedEmail, otp, { logToConsole: false });
  } else {
    console.log('[debug] storing OTP in MongoDB');
    await OTP.deleteMany({ email: normalizedEmail });
    const created = await OTP.create({ email: normalizedEmail, otp, verified: false });
    console.log('[debug] OTP created with id', created._id.toString());
  }

  const emailResult = await sendOtpEmail(normalizedEmail, otp);

  // In dev mode, sendOtpEmail returns devOtp so include it in response to aid testing.
  return {
    email: normalizedEmail,
    emailSent: emailResult.sent,
    ...(emailResult.error ? { emailWarning: emailResult.error } : {}),
    ...(emailResult.devOtp ? { devOtp: emailResult.devOtp } : {})
  };
};

const verifyOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp).trim();

  if (isUsingMemoryStore()) {
    if (!memoryStore.verifyOtp(normalizedEmail, normalizedOtp)) {
      throw new ApiError(400, "Invalid or expired OTP.");
    }

    return { email: normalizedEmail, verified: true };
  }

  const record = await OTP.findOne({ email: normalizedEmail, otp: normalizedOtp });

  if (!record) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  record.verified = true;
  await record.save();

  return { email: normalizedEmail, verified: true };
};

const assertEmailVerified = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (isUsingMemoryStore()) {
    // In memory/dev mode, skip OTP verification to allow creating test users quickly.
    return;
  }

  const record = await OTP.findOne({ email: normalizedEmail, verified: true });

  if (!record) {
    throw new ApiError(
      400,
      "Email is not verified. Complete OTP verification before signing up."
    );
  }

  await OTP.deleteMany({ email: normalizedEmail });
};

module.exports = {
  sendOtp,
  verifyOtp,
  assertEmailVerified
};
