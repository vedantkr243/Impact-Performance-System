const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils/api-error");
const { isUsingMemoryStore } = require("../config/database");
const memoryStore = require("../dev/memoryStore");
const User = require("../models/auth.model");

const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authorization token is required."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    let user;

    if (isUsingMemoryStore()) {
      user = memoryStore.findUserById(payload.sub);
    } else {
      user = await User.findById(payload.sub).select("name email role razorpayCustomerId");
    }

    if (!user) {
      return next(new ApiError(401, "User associated with this token no longer exists."));
    }

    req.user = {
      ...payload,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || "user",
      razorpayCustomerId: user.razorpayCustomerId || null
    };
    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired token."));
  }
};

module.exports = {
  authenticate
};
