const ApiError = require("../../utils api-error");

const validateScorePayload = ({ scores }) => {
  if (!Array.isArray(scores) || scores.length < 3) {
    throw new ApiError(400, "At least 3 score entries are required for analysis.");
  }

  scores.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ApiError(400, `Score entry at index ${index} must be an object.`);
    }

    if (typeof entry.score !== "number" || Number.isNaN(entry.score)) {
      throw new ApiError(400, `Score entry at index ${index} must include a numeric score.`);
    }

    if (entry.score < 0 || entry.score > 1000) {
      throw new ApiError(400, `Score entry at index ${index} is out of the allowed range.`);
    }

    if (entry.date && Number.isNaN(Date.parse(entry.date))) {
      throw new ApiError(400, `Score entry at index ${index} has an invalid date.`);
    }
  });
};

module.exports = {
  validateScorePayload
};
