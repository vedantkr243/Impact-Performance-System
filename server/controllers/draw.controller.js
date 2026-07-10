const asyncHandler = require("../utils/async-handler");
const drawTestService = require("../services/draw-test.service");
const drawAdminService = require("../services/draw-admin.service");

const getActiveDraw = asyncHandler(async (req, res) => {
  const userRole = req.user?.role || "user";
  const isAdmin = userRole === "admin";
  
  const status = await drawTestService.getActiveDrawStatus(req.user?.sub || null);
  
  // Include randomNumber only for admins
  if (status && status.draw && !isAdmin) {
    delete status.draw.randomNumber;
  }

  res.status(200).json({
    success: true,
    data: status
  });
});


const enterDraw = asyncHandler(async (req, res) => {
  const entry = await drawTestService.enterUserInDraw(req.user.sub, {
    planCode: req.body?.planCode
  });

  res.status(201).json({
    success: true,
    message: "Draw entry created.",
    data: entry
  });
});

const settleDraw = asyncHandler(async (req, res) => {
  const drawId = req.params.drawId;
  const results = await drawTestService.settleDraw(drawId);

  res.status(200).json({
    success: true,
    message: "Draw settled successfully.",
    data: results
  });
});

const getDrawResults = asyncHandler(async (req, res) => {
  const results = await drawTestService.getDrawResults(req.params.drawId);

  res.status(200).json({
    success: true,
    data: results
  });
});

// Admin endpoints
const createDraw = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, prizeBreakdown, totalPool } = req.body;
  
  const draw = await drawAdminService.createDraw({
    title,
    description,
    startDate,
    endDate,
    prizeBreakdown,
    totalPool
  });

  res.status(201).json({
    success: true,
    message: "Draw created successfully.",
    data: draw
  });
});

const listAllDraws = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const draws = await drawAdminService.listAllDraws({
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: draws
  });
});

const deleteDraw = asyncHandler(async (req, res) => {
  const { drawId } = req.params;
  
  await drawAdminService.deleteDraw(drawId);

  res.status(200).json({
    success: true,
    message: "Draw deleted successfully."
  });
});

const getDraw = asyncHandler(async (req, res) => {
  const { drawId } = req.params;
  const userRole = req.user?.role || "user";
  const isAdmin = userRole === "admin";
  
  const draw = await drawAdminService.getDraw(drawId);
  
  // Hide randomNumber from non-admin users
  if (draw && !isAdmin) {
    delete draw.randomNumber;
  }

  res.status(200).json({
    success: true,
    data: draw
  });
});

module.exports = {
  getActiveDraw,
  startTestDraw,
  enterDraw,
  settleDraw,
  getDrawResults,
  createDraw,
  listAllDraws,
  deleteDraw,
  getDraw
};
