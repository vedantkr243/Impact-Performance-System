const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    points: { type: Number, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Achievement", achievementSchema);
