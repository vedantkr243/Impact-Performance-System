const asyncHandler = require("../utils/async-handler");
const billingService = require("../services/billing.service");
const { validateCheckoutPayload } = require("../modules/billing/billing.validation");

const listPlans = asyncHandler(async (_req, res) => {
  const plans = billingService.listPlans();

  res.status(200).json({
    success: true,
    data: plans
  });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  validateCheckoutPayload(req.body);

  const { isUsingMemoryStore } = require("../config/database");
  const memoryStore = require("../dev/memoryStore");
  const User = require("../models/auth.model");

  const userId = req.user.sub;
  let user;
  if (isUsingMemoryStore()) {
    user = memoryStore.findUserById(userId);
  } else {
    user = await User.findById(userId);
  }

  if (user && user.isActive) {
    return res.status(400).json({
      success: false,
      message: "You already have an active subscription entry slot. Please enter a draw before purchasing another subscription."
    });
  }

  const session = await billingService.createCheckoutSession({
    userId,
    planCode: req.body.plan
  });

  res.status(201).json({
    success: true,
    message: "Checkout session created successfully.",
    data: session
  });
});

const getCurrentSubscription = asyncHandler(async (req, res) => {
  const subscription = await billingService.getCurrentSubscription(req.user.sub);

  const { isUsingMemoryStore } = require("../config/database");
  const memoryStore = require("../dev/memoryStore");
  const User = require("../models/auth.model");

  let user;
  if (isUsingMemoryStore()) {
    user = memoryStore.findUserById(req.user.sub);
  } else {
    user = await User.findById(req.user.sub).lean();
  }

  // Handle both mongoose document and plain object
  const subObj = subscription && typeof subscription.toObject === "function" 
    ? subscription.toObject() 
    : subscription;

  res.status(200).json({
    success: true,
    data: subObj
      ? {
          ...subObj,
          isActive: user ? user.isActive : false
        }
      : null
  });
});

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const webhookEventId = req.headers["x-razorpay-event-id"] || null;
  const result = await billingService.processRazorpayWebhook(
    signature,
    req.body,
    webhookEventId
  );

  res.status(200).json(result);
});

module.exports = {
  listPlans,
  createCheckoutSession,
  getCurrentSubscription,
  handleRazorpayWebhook
};
