const ApiError = require("../utils/api-error");
const User = require("../models/auth.model");
const Subscription = require("../modules/billing/billing.model");
const { ACTIVE_SUBSCRIPTION_STATUSES } = require("../modules/billing/billing.constants");

const getCharityDetails = async (charityId) => {
  const charity = await User.findById(charityId).select("-passwordHash");

  if (!charity) {
    throw new ApiError(404, "Charity not found.");
  }

  if (!charity.isCharity) {
    throw new ApiError(400, "This account is not a charity account.");
  }

  const totalRevenue = await Subscription.aggregate([
    {
      $match: {
        charityId: charity._id,
        status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
      }
    },
    {
      $group: {
        _id: null,
        totalShare: { $sum: "$charityRevenueShare" }
      }
    }
  ]);

  return {
    id: charity._id,
    name: charity.name,
    email: charity.email,
    contactNumber: charity.contactNumber,
    createdAt: charity.createdAt,
    totalRevenueShare: totalRevenue.length > 0 ? totalRevenue[0].totalShare : 0
  };
};

const getCharityRevenue = async (charityId) => {
  const charity = await User.findById(charityId);

  if (!charity) {
    throw new ApiError(404, "Charity not found.");
  }

  if (!charity.isCharity) {
    throw new ApiError(400, "This account is not a charity account.");
  }

  const subscriptions = await Subscription.find({ charityId }).sort({ createdAt: -1 });

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.charityRevenueShare || 0), 0);

  return {
    charity: {
      id: charity._id,
      name: charity.name,
      email: charity.email
    },
    subscriptions: subscriptions.map(sub => ({
      id: sub._id,
      planCode: sub.planCode,
      status: sub.status,
      charityRevenueShare: sub.charityRevenueShare,
      createdAt: sub.createdAt,
      currentPeriodEnd: sub.currentPeriodEnd
    })),
    totalRevenue,
    currency: "INR"
  };
};

const linkSubscriptionToCharity = async (subscriptionId, charityId, amount) => {
  const charity = await User.findById(charityId);

  if (!charity) {
    throw new ApiError(404, "Charity not found.");
  }

  if (!charity.isCharity) {
    throw new ApiError(400, "This account is not a charity account.");
  }

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new ApiError(404, "Subscription not found.");
  }

  const charityShare = amount * 0.1; // 10% to charity

  subscription.charityId = charityId;
  subscription.charityRevenueShare = charityShare;
  await subscription.save();

  return {
    subscriptionId: subscription._id,
    charityId,
    charityRevenueShare: charityShare
  };
};

module.exports = {
  getCharityDetails,
  getCharityRevenue,
  linkSubscriptionToCharity
};
