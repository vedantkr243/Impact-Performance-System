const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    razorpayCustomerId: {
      type: String,
      default: null,
      index: true
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    razorpayPlanId: {
      type: String,
      required: true
    },
    planCode: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },
    status: {
      type: String,
      required: true,
      index: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    currentPeriodStart: {
      type: Date,
      default: null
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    },
    latestPaymentId: {
      type: String,
      default: null
    },
    selectedCharityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SignupCharity",
      default: null,
      index: true
    },
    charityRevenueShare: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
