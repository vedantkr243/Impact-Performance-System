const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    razorpayCustomerId: {
      type: String,
      default: null,
      index: true
    },
    scores:[
        {  
        type:mongoose.Schema.Types.ObjectId,
        ref:"Score",
        }
    ],
    isActive: {
      type: Boolean,
      default: false
    },
    
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("User", userSchema);