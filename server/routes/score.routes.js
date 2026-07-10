const express = require("express");

const { authenticate } = require("../middleware/authmiddleware");
const scoreController = require("../controllers/scoreController");

const router = express.Router();

// Create a new score (logged by authenticated user)
router.post("/", authenticate, scoreController.addScore);

// Return analysis based on the user's stored scores
router.get("/analysis", authenticate, scoreController.getScoreAnalysis);

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Forbidden: Admin access required." });
  }
};

// Admin endpoints
router.get("/pending", authenticate, isAdmin, scoreController.getPendingScores);
router.put("/:id/approve", authenticate, isAdmin, scoreController.approveScore);
router.put("/:id/reject", authenticate, isAdmin, scoreController.rejectScore);

module.exports = router;
