const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    label: {
        type: String,
    },
    activityType: {
        type: String,
        default: "Golf Round"
    },
    weather: {
        type: String,
        default: "Sunny"
    },
    notes: {
        type: String,
        default: ""
    },
    
    date: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved"
    }
}, { timestamps: true });

module.exports = mongoose.model("Score", scoreSchema);