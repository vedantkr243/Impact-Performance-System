const env = require("../../config/env");

const BILLING_PLANS = {
  monthly: {
    code: "monthly",
    name: "Monthly Plan",
    amount: 12,
    interval: "month",
    razorpayPlanId: env.razorpayMonthlyPlanId,
    totalCount: 120
  },
  yearly: {
    code: "yearly",
    name: "Yearly Plan",
    amount: 124,
    interval: "year",
    razorpayPlanId: env.razorpayYearlyPlanId,
    totalCount: 10
  }
};

const ACTIVE_SUBSCRIPTION_STATUSES = ["created", "authenticated", "active", "pending"];

module.exports = {
  BILLING_PLANS,
  ACTIVE_SUBSCRIPTION_STATUSES
};


