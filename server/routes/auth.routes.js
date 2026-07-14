const express = require("express");
const checkJwt = require("../middleware/auth0");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/auth0SignIn", authController.auth0SignIn);
console.log(authController.auth0Login);
console.log(typeof authController.auth0Login);
router.post(
    "/auth0-login",
    checkJwt,
    authController.auth0Login
);
// Profile management
router.put("/profile", authenticate, authController.updateProfile);
router.put("/profile/photo", authenticate, authController.uploadProfilePhoto);
router.put("/profile/password", authenticate, authController.changePassword);

module.exports = router;
