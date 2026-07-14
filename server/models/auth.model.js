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
      required: false
    },
    provider: {
      type: String,
      default: "local"
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    accountType: {
      type: String,
      trim: true,
      default: "user"
    },
    contactNumber: {
      type: String,
      trim: true,
      default: null
    },
    razorpayCustomerId: {
      type: String,
      default: null,
      index: true
    },
    image:{
        type:String,
        required:true,
        default: null
    },
    isActive: {
      type: Boolean,
      default: false
    },
    scores:[
            {  
            type:mongoose.Schema.Types.ObjectId,
            ref:"Score",
            }
        ],
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("User", userSchema);
