const mongoose = require("mongoose");

const platformContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PlatformContent", platformContentSchema);
