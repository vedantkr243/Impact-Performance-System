require("dotenv").config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("WARNING: Razorpay keys are missing from environment variables.");
  console.warn("Check your .env file in the 'server' folder.");
}

const env = require("./config/env");
const app = require("./app");
const connectDatabase = require("./config/database");

(async () => {
  const connected = await connectDatabase.connect();
  const port = env.port;

  if (!process.env.MAIL_HOST) {
    console.warn(
      "MAIL_* not set in server/.env — OTP emails will NOT go to Gmail. Check server/.env.example."
    );
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!connected) {
      console.log("Running with in-memory data store (development fallback)");
    }
  });
})();


