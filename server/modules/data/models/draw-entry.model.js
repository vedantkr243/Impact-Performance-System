const mongoose = require("mongoose");

const drawEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    drawId: { type: mongoose.Schema.Types.ObjectId, ref: "Draw", required: true, index: true },
    entryCode: { type: String, required: true },
    numbers: [{ type: Number }],
    planCode: { type: String, default: "monthly" },
    matchCount: { type: Number, default: null },
    prizeAmount: { type: Number, default: 0 },
    tier: { type: String, default: null }
  },
  { timestamps: true, versionKey: false }
);

drawEntrySchema.index({ userId: 1, drawId: 1 });

module.exports = mongoose.model("DrawEntry", drawEntrySchema);
