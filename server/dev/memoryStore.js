const crypto = require("crypto");
const mongoose = require("mongoose");
const { hashPassword } = require("../utils/password");

let active = false;

const assertMemoryAllowed = (operation) => {
  if (mongoose.connection.readyState === 1) {
    throw new Error(`Memory store cannot ${operation} while MongoDB is connected.`);
  }
};

const otps = new Map();
const users = new Map();
const usersByEmail = new Map();
const subscriptions = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;

const preseed = async () => {
  const hash = await hashPassword("Password123!");
  createUser({
    name: "Demo User",
    email: "demouser@example.com",
    passwordHash: hash,
    role: "user",
    accountType: "Student"
  });
  createUser({
    name: "Dev User",
    email: "devuser@example.com",
    passwordHash: hash,
    role: "user",
    accountType: "Student"
  });
  const now = new Date();
  upsertSubscription("demo-user", {
    razorpayCustomerId: "mock-customer-demo-user",
    razorpaySubscriptionId: "mock-subscription-demo-user-yearly",
    razorpayPlanId: "mock-plan-yearly",
    planCode: "yearly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    latestPaymentId: `mock-payment-${Date.now()}`,
    charityRevenueShare: 12.4
  });
  const demoUser = users.get("demo-user");
  if (demoUser) {
    demoUser.isActive = true;
  }
};

const enable = () => {
  active = true;
  preseed().catch((err) => console.error("Failed to preseed memory users:", err));
};

const disable = () => {
  active = false;
  otps.clear();
  users.clear();
  usersByEmail.clear();
  subscriptions.clear();
};

const isActive = () => active;

const setOtp = (email, otp, { logToConsole = true } = {}) => {
  assertMemoryAllowed("store OTP");
  otps.set(email, {
    otp,
    verified: false,
    expiresAt: Date.now() + OTP_TTL_MS
  });

  if (logToConsole) {
    console.warn(`[dev-memory] OTP for ${email}: ${otp}`);
  }
};

const verifyOtp = (email, otp) => {
  const record = otps.get(email);

  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return false;
  }

  record.verified = true;
  return true;
};

const assertEmailVerified = (email) => {
  const record = otps.get(email);

  if (!record?.verified) {
    return false;
  }

  otps.delete(email);
  return true;
};

const findUserByEmail = (email) => usersByEmail.get(email) || null;

const createUser = ({ name, email, passwordHash, role = "user", accountType = role, contactNumber = null, image = "/images/default-avatar.png" }) => {
  assertMemoryAllowed("create users");
  const normalizedEmail = email.toLowerCase().trim();
  const id = normalizedEmail === "demouser@example.com" || normalizedEmail === "devuser@example.com"
    ? "demo-user"
    : crypto.randomUUID();

  const user = {
    _id: id,
    name,
    email,
    passwordHash,
    role,
    accountType,
    contactNumber,
    image,
    isActive: false,
    createdAt: new Date()
  };

  users.set(user._id, user);
  usersByEmail.set(email, user);
  return user;
};

const findUserById = (id) => users.get(id) || null;

const upsertSubscription = (userId, subscription) => {
  const existing = subscriptions.get(userId);
  const next = {
    ...(existing || {}),
    ...subscription,
    userId,
    updatedAt: new Date(),
    createdAt: existing?.createdAt || new Date()
  };
  subscriptions.set(userId, next);
  return next;
};

const findSubscriptionByUserId = (userId) => subscriptions.get(userId) || null;

const countUsers = () => users.size;

module.exports = {
  enable,
  disable,
  isActive,
  setOtp,
  verifyOtp,
  assertEmailVerified,
  findUserByEmail,
  createUser,
  findUserById,
  upsertSubscription,
  findSubscriptionByUserId,
  countUsers
};
