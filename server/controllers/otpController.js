const otpGenerator = require("otp-generator");
const User = require("../models/User"); // Adjust path as needed
const OTP = require("../models/OTP"); // Adjust path as needed

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Email in sendOtp controller", email);

        // Check if user already exists
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Generate OTP
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated: ", otp);

        // Ensure OTP is unique
        let result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }

        // Create an entry in DB for OTP (email sending handled by pre-save hook in OTP model)
        const otpBody = await OTP.create({ email, otp });
        console.log(otpBody);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otpBody,
        });
    } catch (err) {
        console.error("Error in sending OTP:", err);
        return res.status(500).json({
            success: false,
            message: 'Error in sending OTP, Please try again',
            error: err.message,
        });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required',
            });
        }

        // 2. Find the most recent OTP for the user
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

        // 3. Check if OTP exists and is valid
        if (recentOtp.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or expired. Please request a new one.',
            });
        } else if (otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
            });
        }

        // 4. OTP is valid, you might want to delete it from the DB here
        await OTP.deleteMany({ email }); // Delete all OTPs for this email after successful verification

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying OTP. Please try again.',
            error: error.message,
        });
    }
};
