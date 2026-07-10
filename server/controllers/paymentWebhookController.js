const User = require("../models/User");
const Finance = require("../models/Finance");
const crypto = require("crypto");
const mailSender = require("./mailSender");
const { paymentSuccessEmail } = require("./mail/templates/paymentSuccessEmail");

exports.handlePaymentWebhook = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature !== digest) {
        return res.status(400).json({ msg: "Invalid signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
        const payment = payload.payment.entity;
        const amountInUsd = payment.amount / 100;
        const orderId = payment.order_id;
        
        // Step 2: Split money (70/20/10)
        const rewardShare = amountInUsd * 0.70;
        const charityShare = amountInUsd * 0.20;
        const platformShare = amountInUsd * 0.10;

        // Find user by email provided in notes during order creation
        const userEmail = payment.notes.email;
        const user = await User.findOneAndUpdate(
            { email: userEmail },
            { 
                approved: true,
                $inc: { totalCharityContribution: charityShare }
            },
            { new: true }
        );

        // Update Global Finance Pools for the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        await Finance.findOneAndUpdate(
            { cycleMonth: currentMonth, cycleYear: currentYear },
            { 
                $inc: { 
                    totalRevenue: amountInUsd,
                    rewardPool: rewardShare,
                    charityPool: charityShare,
                    platformPool: platformShare
                } 
            },
            { upsert: true, new: true }
        );

        if (user) {
            await mailSender(
                user.email,
                "Payment Received - Account Activated",
                paymentSuccessEmail(user.firstName, amountInUsd, orderId, payment.id)
            );
        }
    }

    res.json({ status: "ok" });
};