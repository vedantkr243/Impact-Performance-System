const mongoose = require("mongoose");

const signupCharitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("SignupCharity", signupCharitySchema);
