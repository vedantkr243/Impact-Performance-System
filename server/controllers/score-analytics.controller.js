const asyncHandler = require("../utils/async-handler");
const { validateScorePayload } = require("../modules/score-analytics/score-analytics.validation");
const scoreAnalyticsService = require("../services/score-analytics.service");

const analyzeScores = asyncHandler(async (req, res) => {
  validateScorePayload(req.body);

  const analysis = scoreAnalyticsService.analyzeScores(req.body);

  res.status(200).json({
    success: true,
    message: "Score analysis generated successfully.",
    data: analysis
  });
});

module.exports = {
  analyzeScores
};
