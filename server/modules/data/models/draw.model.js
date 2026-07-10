const mongoose = require("mongoose");

const drawSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    prize: { type: String, required: true },
    entryFee: { type: String, default: "Free" },
    drawDate: { type: Date, required: true },
    status: { type: String, enum: ["open", "closed", "completed"], default: "open" },
    requiredPlan: { type: String, enum: ["any", "monthly", "yearly"], default: "any" },
    isFeatured: { type: Boolean, default: false },
    countdown: {
      days: String,
      hours: String,
      minutes: String,
      seconds: String
    },
    prizeBreakdown: [
      {
        name: String,
        value: Number,
        color: String
      }
    ],
    randomNumber: { type: [Number], default: null },
    winningNumbers: [Number],
    winnerName: { type: String, default: null },
    mode: { type: String, enum: ["test", "production"], default: "production" },
    totalPool: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    settledAt: { type: Date, default: null },
    analytics: {
      participants: Number,
      averageEntries: Number,
      largestPrize: String,
      impact: String,
      trend: [{ label: String, value: Number }]
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Draw", drawSchema);
