const express = require("express");

const charityController = require("../controllers/charity.controller");
const { authenticate } = require("../middleware/authmiddleware");

const router = express.Router();

router.get("/:charityId", charityController.getCharityDetails);
router.get("/revenue/details", authenticate, charityController.getCharityRevenue);

module.exports = router;
