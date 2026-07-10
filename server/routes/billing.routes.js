const express = require("express");

const billingController = require("../controllers/billing.controller");
const { authenticate } = require("../middleware/authmiddleware");

const router = express.Router();

router.get("/plans", billingController.listPlans);
router.post("/checkout-session", authenticate, billingController.createCheckoutSession);
router.get("/subscription", authenticate, billingController.getCurrentSubscription);
router.post("/webhooks/razorpay", billingController.handleRazorpayWebhook);

module.exports = router;
