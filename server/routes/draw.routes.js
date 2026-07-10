const express = require("express");

const drawAdminService = require("../services/draw-admin.service");
const asyncHandler = require("../utils/async-handler");
const { authenticate } = require("../middleware/authmiddleware");
const { optionalAuthenticate } = require("../middleware/optional-auth");
const { requireAdmin } = require("../middleware/admin-auth.middleware");

const router = express.Router();

// Public: get a single draw by ID
router.get("/:drawId", optionalAuthenticate, asyncHandler(async (req, res) => {
  const draw = await drawAdminService.getDraw(req.params.drawId);
  if (draw && req.user?.role !== "admin") {
    delete draw.randomNumber;
  }
  res.status(200).json({ success: true, data: draw });
}));

// Public: get draw results
router.get("/:drawId/results", asyncHandler(async (req, res) => {
  const draw = await drawAdminService.getDraw(req.params.drawId);
  res.status(200).json({ success: true, data: draw });
}));

// ─── Auto-Settle (any authenticated user) ─────────────────────────────────────
// Triggered by the frontend when a draw's countdown reaches zero.
// Works for both still-open expired draws AND completed draws where prizes
// were never distributed (e.g. settled before prize code was deployed).
router.post("/:drawId/auto-settle", authenticate, asyncHandler(async (req, res) => {
  const draw = await drawAdminService.getDraw(req.params.drawId);

  if (!draw) {
    return res.status(404).json({ success: false, message: "Draw not found." });
  }

  // Only allow if the draw deadline has actually passed
  const deadline = draw.drawDate || draw.endsAt;
  if (deadline && new Date(deadline) > new Date()) {
    return res.status(403).json({ success: false, message: "Draw has not ended yet." });
  }

  // settleMonthlyDraw now handles idempotency:
  //  - If completed + prizes already paid → throws error (caught below)
  //  - If completed + prizes never paid → re-runs distribution
  //  - If open + expired → full settlement
  try {
    const results = await drawAdminService.settleMonthlyDraw(req.params.drawId);
    return res.status(200).json({ success: true, message: "Draw settled successfully.", data: results });
  } catch (err) {
    // "Already paid" is a non-error for the frontend — draw is done
    if (err.statusCode === 400 && err.message?.includes("already")) {
      return res.status(200).json({ success: true, message: "Already settled.", data: { alreadySettled: true } });
    }
    throw err;
  }
}));

// ─── Admin: manual settle ──────────────────────────────────────────────────────
router.post("/:drawId/settle", authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const results = await drawAdminService.settleMonthlyDraw(req.params.drawId);
  res.status(200).json({ success: true, message: "Draw settled successfully.", data: results });
}));

// Admin: delete a draw
router.delete("/:drawId", authenticate, requireAdmin, asyncHandler(async (req, res) => {
  await drawAdminService.deleteDraw(req.params.drawId);
  res.status(200).json({ success: true, message: "Draw deleted successfully." });
}));

module.exports = router;
