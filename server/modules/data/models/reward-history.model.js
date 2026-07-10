const mongoose = require("mongoose");

const rewardHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    reward: { type: String, required: true },
    category: { type: String, default: "General" },
    points: { type: Number, required: true },
    status: { type: String, enum: ["Redeemed", "Pending", "Cancelled"], default: "Redeemed" }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("RewardHistory", rewardHistorySchema);
