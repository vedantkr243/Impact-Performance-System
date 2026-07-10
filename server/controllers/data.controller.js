const asyncHandler = require("../utils/async-handler");
const dataRepository = require("../modules/data/data.repository");

exports.getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user?.sub || req.user?.id;
  const dashboardData = await dataRepository.getDashboardPayload(userId);

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});