const express = require("express");
const { authenticate } = require("../middleware/authmiddleware");
const drawController = require("../controllers/drawController");
const asyncHandler = require("../utils/async-handler");
const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  res.status(403).json({ success: false, message: "Admin access required." });
};

// All routes require authentication
router.use(authenticate);

// User + Admin: list draws (open-only for users, all for admins)
router.get("/", drawController.listDraws);

// User: enter a specific draw
router.post("/:id/enter", drawController.enterDraw);

// Public/User: get draw results
router.get("/:id/results", asyncHandler(async (req, res) => {
  const drawAdminService = require("../services/draw-admin.service");
  const draw = await drawAdminService.getDraw(req.params.id);
  res.status(200).json({ success: true, data: draw });
}));

// User: auto-settle an expired draw
router.post("/:id/auto-settle", asyncHandler(async (req, res) => {
  const drawAdminService = require("../services/draw-admin.service");
  const draw = await drawAdminService.getDraw(req.params.id);

  if (!draw) {
    return res.status(404).json({ success: false, message: "Draw not found." });
  }

  // Only allow if the draw deadline has actually passed
  const deadline = draw.drawDate || draw.endsAt;
  if (deadline && new Date(deadline) > new Date()) {
    return res.status(403).json({ success: false, message: "Draw has not ended yet." });
  }

  try {
    const results = await drawAdminService.settleMonthlyDraw(req.params.id);
    return res.status(200).json({ success: true, message: "Draw settled successfully.", data: results });
  } catch (err) {
    if (err.statusCode === 400 && err.message?.includes("already")) {
      return res.status(200).json({ success: true, message: "Already settled.", data: { alreadySettled: true } });
    }
    throw err;
  }
}));

// Admin: settle a draw manually
router.post("/:id/settle", isAdmin, asyncHandler(async (req, res) => {
  const drawAdminService = require("../services/draw-admin.service");
  const results = await drawAdminService.settleMonthlyDraw(req.params.id);
  res.status(200).json({ success: true, message: "Draw settled successfully.", data: results });
}));

// Admin: view full draw details (entries + winner)
router.get("/:id/details", isAdmin, drawController.getDrawDetails);

// Admin: update draw (e.g. set requiredPlan, status)
router.put("/:id", isAdmin, drawController.updateDraw);

// Admin: create draw
router.post("/", isAdmin, drawController.createDraw);

// Admin: delete draw
router.delete("/:id", isAdmin, drawController.deleteDraw);



module.exports = router;
