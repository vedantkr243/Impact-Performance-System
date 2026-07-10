const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    type: { type: String, enum: ["score", "win", "charity", "system"], default: "system" },
    label: { type: String, required: true },
    timeLabel: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("UserActivity", userActivitySchema);
