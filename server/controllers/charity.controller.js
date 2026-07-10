const asyncHandler = require("../utils/async-handler");
const charityService = require("../services/charity.service");

const getCharityDetails = asyncHandler(async (req, res) => {
  const charityId = req.params.charityId;
  const result = await charityService.getCharityDetails(charityId);

  res.status(200).json({
    success: true,
    data: result
  });
});

const getCharityRevenue = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const result = await charityService.getCharityRevenue(userId);

  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  getCharityDetails,
  getCharityRevenue
};
