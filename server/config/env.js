const dotenv = require("dotenv");

dotenv.config();

const mongoUri =
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/newprd";

if (!process.env.MONGODB_URI && !process.env.MONGO_URL) {
  console.warn("Warning: MONGODB_URI / MONGO_URL not set. Falling back to local MongoDB at", mongoUri);
} else if (process.env.MONGO_URL && !process.env.MONGODB_URI) {
  console.log("Using MONGO_URL from environment for database connection.");
}

const jwtSecret = process.env.JWT_SECRET || "dev_jwt_secret";
if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET not set. Using a development default secret — do not use in production.");
}

// Razorpay-related variables are optional unless billing is enabled
const optionalVariables = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET"
];

module.exports = {
  PORT: Number(process.env.PORT) || 4000,
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  razorpayMonthlyPlanId: process.env.RAZORPAY_MONTHLY_PLAN_ID,
  razorpayYearlyPlanId: process.env.RAZORPAY_YEARLY_PLAN_ID,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  billingMockMode: process.env.BILLING_MOCK_MODE === "true"
};
