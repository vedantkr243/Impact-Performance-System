const asyncHandler = require("../utils/async-handler");
const authService = require("../services/auth.service");
const otpService = require("../services/auth.otp.service");
const { validateSignupPayload, validateLoginPayload, validateOtpPayload } = require("../modules/auth/auth.validation");

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
  changePassword
};
