const ApiError = require("../../utils/api-error");

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateSignupPayload = ({ name, firstName, lastName, email, password, confirmPassword, role, accountType }) => {
  const resolvedName = (name || [firstName, lastName].filter(Boolean).join(" ")).trim();

  if (!resolvedName || !email || !password || !confirmPassword) {
    throw new ApiError(400, "Name, email, password, and confirmPassword are required.");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirmPassword must match.");
  }

  const resolvedRole = String(role || accountType || "user").toLowerCase();
  const allowedRoles = ["user", "admin", "charity"];
  if (!allowedRoles.includes(resolvedRole)) {
    throw new ApiError(400, "Invalid account type.");
  }
};

const validateLoginPayload = ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }
};

const validateOtpPayload = ({ email, otp }, { requireOtp = false } = {}) => {
  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  if (requireOtp && (!otp || String(otp).trim().length < 4)) {
    throw new ApiError(400, "A valid OTP is required.");
  }
};

module.exports = {
  validateSignupPayload,
  validateLoginPayload,
  validateOtpPayload
};
