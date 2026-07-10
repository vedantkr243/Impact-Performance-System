const express = require("express");

const { authenticate } = require("../middleware/authmiddleware");
const scoreAnalyticsController = require("../controllers/score-analytics.controller");

const router = express.Router();

router.post("/analyze", authenticate, scoreAnalyticsController.analyzeScores);

module.exports = router;
