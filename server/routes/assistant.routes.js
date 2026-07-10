const express = require("express");

const { authenticate } = require("../middleware/authmiddleware");
const assistantController = require("../controllers/assistant.controller");

const router = express.Router();

router.post("/ask", authenticate, assistantController.askAssistant);

module.exports = router;
