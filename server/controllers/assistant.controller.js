const asyncHandler = require("../utils/async-handler");
const { validateAssistantPayload } = require("../modules/assistant/assistant.validation");
const assistantService = require("../services/assistant.service");

const askAssistant = asyncHandler(async (req, res) => {
  validateAssistantPayload(req.body);

  const result = await assistantService.askAssistant({
    question: req.body.question,
    context: req.body.context,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "Assistant response generated successfully.",
    data: result
  });
});

module.exports = { askAssistant };
