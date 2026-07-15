const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils api-error");
const User = require("../models/auth.model");
const { isUsingMemoryStore } = require("../config/database");
const memoryStore = require("../dev/memoryStore");

const optionalAuthenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (isUsingMemoryStore()) {
      const user = memoryStore.findUserById(payload.sub);
      if (!user) {
        req.user = null;
        return next();
      }
      req.user = {
        ...payload,
        id: user._id,
        name: user.name,
        email: user.email
      };
      return next();
    }

    const user = await User.findById(payload.sub).select("name email razorpayCustomerId");
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      ...payload,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      razorpayCustomerId: user.razorpayCustomerId || null
    };
    next();
  } catch (_error) {
    req.user = null;
    next();
  }
};

module.exports = { optionalAuthenticate };
