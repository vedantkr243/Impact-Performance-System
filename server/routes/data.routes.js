const express = require("express");
const router = express.Router();
const dataController = require("../controllers/data.controller");
const { authenticate } = require("../middleware/authmiddleware");

// Use the real controller instead of the static proxy
router.get("/dashboard", authenticate, dataController.getDashboardData);

module.exports = router;
