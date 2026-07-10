const env = require("../../config/env");

let razorpayClient = null;

if (env.razorpayKeyId && env.razorpayKeySecret) {
  try {
    const Razorpay = require("razorpay");
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret
    });
  } catch (e) {
    console.warn("Razorpay client failed to initialize:", e.message);
    razorpayClient = null;
  }
} else {
  console.warn("Razorpay keys not set — payment client disabled in this environment.");
}

module.exports = razorpayClient;
