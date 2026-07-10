const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    providerEventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    provider: {
      type: String,
      default: "razorpay"
    },
    eventType: {
      type: String,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
