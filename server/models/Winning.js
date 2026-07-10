const mongoose = require("mongoose");

const winningSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    cycleMonth: {
        type: Number,
        required: true,
    },
    cycleYear: {
        type: Number,
        required: true,
    },
    rewardTier: {
        type: String,
        required: true,
    },
    proofUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending_proof", "pending_verification", "verified", "rejected"],
        default: "pending_proof",
    }
}, { timestamps: true });

module.exports = mongoose.model("Winning", winningSchema);