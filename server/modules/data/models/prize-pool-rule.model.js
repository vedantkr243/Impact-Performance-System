const mongoose = require("mongoose");

const prizePoolRuleSchema = new mongoose.Schema(
  {
    matchType: { type: String, required: true, unique: true },
    share: { type: String, required: true },
    rollover: { type: String, required: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PrizePoolRule", prizePoolRuleSchema);
