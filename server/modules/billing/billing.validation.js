const ApiError = require("../../utils/api-error");

const validateCheckoutPayload = ({ plan }) => {
  if (!plan) {
    throw new ApiError(400, "Plan is required.");
  }

  if (!["monthly", "yearly"].includes(plan)) {
    throw new ApiError(400, "Plan must be either monthly or yearly.");
  }
};

module.exports = {
  validateCheckoutPayload
};
