const ApiError = require("../utils/api-error");

const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required."));
  }

  if (req.user.role !== "admin") {
    return next(new ApiError(403, "Admin access required."));
  }

  next();
};

module.exports = {
  requireAdmin 
};