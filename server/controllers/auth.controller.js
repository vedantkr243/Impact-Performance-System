const asyncHandler = require("../utils/async-handler");
const authService = require("../services/auth.service");
const otpService = require("../services/auth.otp.service");
const { validateSignupPayload, validateLoginPayload, validateOtpPayload } = require("../modules/auth/auth.validation");
const jwt = require("jsonwebtoken");
const User = require("../models/auth.model");

const signup = asyncHandler(async (req, res) => {
  console.log( JSON.stringify(req.body));
  try {
    validateSignupPayload(req.body);
    const result = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: result
    });
  } catch (err) {
    console.error('[debug] Signup error:', err && err.message ? err.message : err);
    throw err; // let error middleware handle response
  }
});

const login = asyncHandler(async (req, res) => {
  try{
    validateLoginPayload(req.body);
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: result
  });
  }
   catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login failure, Please try again',
            error:error.message
        });
    
}});
const auth0SignIn= asyncHandler(async (req, res) => {
  try{
    const result = await authService.auth0SignIn(req.body);
    res.status(200).json({
    success: true,
    message: "Login successful.",
    data: result
  });
  
  }
  catch(error){
    console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login failure by google or apple, Please try again',
            error:error.message
        });
  }
});
const auth0Login = async (req, res) => {
  console.log("AUTH0 LOGIN CONTROLLER HIT");
console.log(req.auth);
    try {
      console.log("========== AUTH0 LOGIN CONTROLLER ==========");
    console.log(req.auth);
      console.log("✅ auth0Login controller reached");
      
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No Authorization header provided." });
        }

        const domain = process.env.AUTH0_DOMAIN;
        console.log(`[auth0Login] Fetching userinfo from domain: ${domain}`);
        
        const axios = require("axios");
        const userinfoResponse = await axios.get(`https://${domain}/userinfo`, {
            headers: { Authorization: authHeader }
        });
        
        const profile = userinfoResponse.data;
        console.log("[auth0Login] Profile retrieved successfully:", JSON.stringify(profile));

        const email = profile.email || `${profile.sub}@auth0.com`;
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`[auth0Login] User not found. Creating new user for: ${email}`);
            user = await User.create({
                email,
                name: profile.name || profile.nickname || "Auth0 User",
                image: profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || "User"}`,
                provider: "auth0",
            });
        } else {
            console.log(`[auth0Login] Existing user found: ${user.email}, role: ${user.role}`);
            if (!user.provider || user.provider === "local") {
                user.provider = "auth0";
                await user.save();
            }
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role || "user",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        console.log("[auth0Login] Generated local JWT token:", token);

        return res.json({
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user",
                image: user.image,
                isActive: user.isActive,
            },
            subscription: user.subscription || null,
            hasActiveSubscription: user.hasActiveSubscription || false,
        });
    } catch (err) {
        console.error("[auth0Login] Error during Auth0 login:", err);
        return res.status(401).json({
            success: false,
            message: err.response?.data?.message || err.message,
        });
    }
};
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.sub);

  res.status(200).json({
    success: true,
    data: user
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.sub, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: result
  });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const result = await authService.uploadProfilePhoto(req.user.sub, req.files);

  res.status(200).json({
    success: true,
    message: "Profile photo updated successfully.",
    data: result
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.sub, req.body);

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
    data: result
  });
});

const sendOtp = asyncHandler(async (req, res) => {
  validateOtpPayload(req.body, { requireOtp: false });
  const result = await otpService.sendOtp(req.body);

  res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
    data: result
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  validateOtpPayload(req.body, { requireOtp: true });
  const result = await otpService.verifyOtp(req.body);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    data: result
  });
});

module.exports = {
  signup,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  auth0Login,
  auth0SignIn
};
