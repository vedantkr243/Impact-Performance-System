const ApiError = require("../../utils api-error");

const validateAssistantPayload = ({ question, context }) => {
  if (!question || typeof question !== "string" || !question.trim()) {
    throw new ApiError(400, "A non-empty question is required.");
  }

  if (!context || typeof context !== "object") {
    throw new ApiError(400, "Context is required.");
  }

  // scores array is optional — users with 0 scores still get a coaching response
  if (context.scores !== undefined && !Array.isArray(context.scores)) {
    throw new ApiError(400, "Context scores must be an array when provided.");
  }

  if (Array.isArray(context.scores)) {
    context.scores.forEach((entry, index) => {
      if (typeof entry?.score !== "number" || Number.isNaN(entry.score)) {
        throw new ApiError(400, `Score entry at index ${index} must include a numeric score.`);
      }
    });
  }

  if (context.winnings && !Array.isArray(context.winnings)) {
    throw new ApiError(400, "Winnings context must be an array when provided.");
  }
};

module.exports = { validateAssistantPayload };
