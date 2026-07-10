const mongoose = require("mongoose");

const charitySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    focus: { type: String, required: true },
    impact: { type: String, default: "$0 deployed" },
    mood: { type: String, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Charity", charitySchema);
