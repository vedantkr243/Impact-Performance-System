const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    tone: { type: String, default: "text-slate-500" },
    amount: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
