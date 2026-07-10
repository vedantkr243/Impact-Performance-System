const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
    totalRevenue: {
        type: Number,
        default: 0,
    },
    rewardPool: {
        type: Number,
        default: 0, // 70%
    },
    charityPool: {
        type: Number,
        default: 0, // 20%
    },
    platformPool: {
        type: Number,
        default: 0, // 10%
    },
    cycleMonth: {
        type: Number,
        default: new Date().getMonth(),
    },
    cycleYear: {
        type: Number,
        default: new Date().getFullYear(),
    }
}, { timestamps: true });

module.exports = mongoose.model("Finance", financeSchema);