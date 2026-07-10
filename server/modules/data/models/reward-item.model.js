const mongoose = require("mongoose");

const rewardItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["featured", "marketplace"], required: true },
    title: { type: String, required: true },
    image: { type: String, default: null },
    value: { type: String, default: null },
    points: { type: Number, required: true },
    badge: { type: String, default: null },
    stock: { type: String, default: "In Stock" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("RewardItem", rewardItemSchema);
