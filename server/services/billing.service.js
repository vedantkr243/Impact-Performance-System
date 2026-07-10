const crypto = require("crypto");

const env = require("../config/env");
const ApiError = require("../utils/api-error");
const { isUsingMemoryStore } = require("../config/database");
const memoryStore = require("../dev/memoryStore");
const memoryDataStore = require("../dev/memoryDataStore");
const User = require("../models/auth.model");
const razorpay = require("../modules/billing/razorpay.client");
const Subscription = require("../modules/billing/billing.model");
const PaymentEvent = require("../modules/billing/payment-event.model");
const { BILLING_PLANS, ACTIVE_SUBSCRIPTION_STATUSES } = require("../modules/billing/billing.constants");
const financeService = require("./finance.service");

const useMemoryBillingStore = () => isUsingMemoryStore();

const getBillingUser = async (userId) => {
  if (useMemoryBillingStore()) {
    return memoryStore.findUserById(userId);
  }

  return User.findById(userId);
};

const getPlanAmount = (planCode) => (planCode === "yearly" ? 124 : 12);

const recordPlanPayment = async (userId, planCode) => {
  const planAmount = getPlanAmount(planCode);
  await financeService.recordSubscriptionRevenue(planAmount);
};

const getMockPeriodEnd = (planCode) => {
  const end = new Date();
  if (planCode === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
};

const buildMockSubscription = (userId, planCode) => {
  const now = new Date();
  return {
    userId,
    razorpayCustomerId: `mock-customer-${userId}`,
    razorpaySubscriptionId: `mock-subscription-${userId}-${planCode}`,
    razorpayPlanId: `mock-plan-${planCode}`,
    planCode,
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: now,
    currentPeriodEnd: getMockPeriodEnd(planCode),
    latestPaymentId: `mock-payment-${Date.now()}`,
    charityRevenueShare: getPlanAmount(planCode) * 0.1
  };
};

const saveMockSubscription = async (userId, planCode) => {
  const mockSubscription = buildMockSubscription(userId, planCode);

  if (useMemoryBillingStore()) {
    const saved = memoryStore.upsertSubscription(userId, mockSubscription);
    await recordPlanPayment(userId, planCode);
    const user = memoryStore.findUserById(userId);
    if (user) {
      user.isActive = true;
    }
    return saved;
  }

  const saved = await Subscription.findOneAndUpdate(
    { userId, razorpaySubscriptionId: mockSubscription.razorpaySubscriptionId },
    mockSubscription,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await recordPlanPayment(userId, planCode);
  await User.findByIdAndUpdate(userId, { isActive: true });
  return saved;
};
const listPlans = () =>
  Object.values(BILLING_PLANS).map((plan) => ({
    code: plan.code,
    name: plan.name,
    interval: plan.interval
  }));

const createCheckoutSession = async ({ userId, planCode }) => {
  const plan = BILLING_PLANS[planCode];

  if (!plan) {
    throw new ApiError(400, "Plan must be either monthly or yearly.");
  }

  const user = await getBillingUser(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (env.billingMockMode) {
    const subscription = await saveMockSubscription(userId, planCode);
    return {
      checkout: {
        provider: "mock",
        subscriptionId: subscription.razorpaySubscriptionId,
        planCode,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        customer: {
          name: user.name,
          email: user.email
        }
      },
      subscription
    };
  }

  if (!razorpay) {
    throw new ApiError(
      503,
      "Razorpay checkout is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env, then restart the server."
    );
  }

  if (!env.razorpayKeyId) {
    throw new ApiError(503, "Razorpay public key is missing. Set RAZORPAY_KEY_ID in server/.env.");
  }

  if (!plan.razorpayPlanId) {
    throw new ApiError(
      503,
      `Razorpay plan is not configured for the ${planCode} plan. Set RAZORPAY_${String(planCode).toUpperCase()}_PLAN_ID in server/.env.`
    );
  }

  const existingSubscription = await Subscription.findOne({
    userId,
    status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
  });

  if (existingSubscription) {
    throw new ApiError(409, "An active subscription already exists for this user.");
  }

  let subscription;
  try {
    subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: plan.totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: user._id.toString(),
        planCode: plan.code,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    const providerMessage =
      error?.error?.description ||
      error?.error?.reason ||
      error?.message ||
      "Razorpay rejected the subscription request.";

    throw new ApiError(502, `Unable to create Razorpay subscription: ${providerMessage}`);
  }

  return {
    checkout: {
      provider: "razorpay",
      keyId: env.razorpayKeyId,
      subscriptionId: subscription.id,
      planCode: plan.code,
      customer: {
        name: user.name,
        email: user.email
      }
    }
  };
};

const getCurrentSubscription = async (userId) => {
  if (useMemoryBillingStore()) {
    return memoryStore.findSubscriptionByUserId(userId);
  }

  const subscription = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
  return subscription;
};

const mapRazorpaySubscription = (razorpaySubscription, payment = null) => {
  const planEntry = Object.values(BILLING_PLANS).find(
    (plan) => plan.razorpayPlanId === razorpaySubscription.plan_id
  );

  return {
    razorpayCustomerId: payment?.customer_id || null,
    razorpaySubscriptionId: razorpaySubscription.id,
    razorpayPlanId: razorpaySubscription.plan_id,
    planCode: planEntry?.code || razorpaySubscription.notes?.planCode || "monthly",
    status: razorpaySubscription.status,
    cancelAtPeriodEnd: Boolean(razorpaySubscription.remaining_count === 0),
    currentPeriodStart: razorpaySubscription.current_start
      ? new Date(razorpaySubscription.current_start * 1000)
      : null,
    currentPeriodEnd: razorpaySubscription.current_end
      ? new Date(razorpaySubscription.current_end * 1000)
      : null,
    latestPaymentId: payment?.id || razorpaySubscription.charge_at || null
  };
};

const upsertSubscriptionFromRazorpay = async (razorpaySubscription, payment = null) => {
  const userId = razorpaySubscription.notes?.userId;

  if (!userId) {
    throw new ApiError(400, "Razorpay subscription notes are missing userId.");
  }

  const user = await getBillingUser(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const mappedSubscription = mapRazorpaySubscription(razorpaySubscription, payment);

  if (mappedSubscription.razorpayCustomerId) {
    await User.findByIdAndUpdate(userId, {
      razorpayCustomerId: mappedSubscription.razorpayCustomerId
    });
  }

  // Calculate charity revenue if this is a charity account
  const targetCharityId = user.isCharity ? userId : user.selectedCharityId;
  let charityRevenueShare = 0;
  if (targetCharityId) {
    // Get plan price to calculate 10% revenue share
    const plan = BILLING_PLANS[mappedSubscription.planCode];
    if (plan && plan.amount) {
      charityRevenueShare = plan.amount * 0.1; // 10% to charity
    }
  }

  await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: mappedSubscription.razorpaySubscriptionId },
    {
      ...mappedSubscription,
      userId,
      charityId: targetCharityId || null,
      charityRevenueShare
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  if (ACTIVE_SUBSCRIPTION_STATUSES.includes(mappedSubscription.status)) {
    await recordPlanPayment(userId, mappedSubscription.planCode);
    await User.findByIdAndUpdate(userId, { isActive: true });
  }
};

const handleSubscriptionEvent = async (payload) => {
  const subscriptionEntity = payload.subscription?.entity || payload.subscription;
  if (!subscriptionEntity) {
    return;
  }

  const paymentEntity = payload.payment?.entity || payload.payment || null;
  const freshSubscription = await razorpay.subscriptions.fetch(subscriptionEntity.id);
  await upsertSubscriptionFromRazorpay(freshSubscription, paymentEntity);
};

const processRazorpayWebhook = async (signature, rawBody, webhookEventId = null) => {
  if (!signature) {
    throw new ApiError(400, "Missing Razorpay signature header.");
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", env.razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid signature");
    }
  } catch (_error) {
    throw new ApiError(400, "Invalid Razorpay webhook signature.");
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const providerEventId =
    webhookEventId ||
    event.payload?.payment?.entity?.id ||
    event.payload?.subscription?.entity?.id ||
    event.event;

  const alreadyProcessed = await PaymentEvent.findOne({ providerEventId });

  if (alreadyProcessed) {
    return { received: true, duplicate: true };
  }

  switch (event.type) {
    case "subscription.authenticated":
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.completed":
    case "subscription.updated":
      await handleSubscriptionEvent(event.payload);
      break;
    case "subscription.cancelled":
    case "subscription.halted":
      await handleSubscriptionEvent(event.payload);
      break;
    default:
      break;
  }

  await PaymentEvent.create({
    providerEventId,
    provider: "razorpay",
    eventType: event.type
  });

  return { received: true, duplicate: false };
};

module.exports = {
  listPlans,
  createCheckoutSession,
  getCurrentSubscription,
  processRazorpayWebhook
};









