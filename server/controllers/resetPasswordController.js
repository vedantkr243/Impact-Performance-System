const User = require("../models/User"); // Adjust path as needed
const mailSender = require("./mailSender"); // Adjust path as needed
const passwordResetTemplate = require("../mail/templates/passwordResetTemplate"); // Adjust path as needed
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Generate Reset Password Token and send email
exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Your email is not registered with us",
            });
        }

        // 2. Generate unique token
        const token = crypto.randomBytes(20).toString("hex");

        // 3. Update user with token and expiry (e.g., 5 minutes)
        // Ensure resetPasswordExpires is a Date object for proper comparison
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
            },
            { new: true } // Return the updated document
        );

        // 4. Create URL for password reset
        // Replace with your actual frontend URL
        const url = `http://localhost:3000/update-password/${token}`;

        // 5. Send Email
        await mailSender(
            email,
            "Password Reset Link from Your App",
            passwordResetTemplate(url)
        );

        return res.status(200).json({
            success: true,
            message: "Password reset email sent successfully. Please check your inbox.",
        });
    } catch (error) {
        console.error("Reset Password Token Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while generating the reset token",
            error: error.message,
        });
    }
};

// Reset Password (Update password in DB)
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        // 1. Validation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match",
            });
        }

        // 2. Get user details from DB using token
        const userDetails = await User.findOne({ token: token });

        // 3. If no user, token is invalid
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid token or token not found",
            });
        }

        // 4. Check token expiry
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: "Token has expired, please regenerate your token",
            });
        }

        // 5. Hash new password and update in DB
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(userDetails._id, { password: hashedPassword, token: null, resetPasswordExpires: null });

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting the password",
            error: error.message,
        });
    }
};