const express = require("express");
const asyncHandler = require("../utils/async-handler");
const connectDatabase = require("../config/database");
const memoryStore = require("../dev/memoryStore");
const User = require("../models/auth.model");
const Score = require("../models/Score");

const router = express.Router();

// GET  api/v1/debug/db-status
// Returns whether app is using memory store and mongoose connection state
router.get(
  "/db-status",

  
  asyncHandler(async (req, res) => {
    const usingMemory = connectDatabase.isUsingMemoryStore();
    const mongooseState = require("mongoose").connection.readyState;

    res.json({
      success: true,
      usingMemoryStore: usingMemory,
      memoryStoreActive: memoryStore.isActive(),
      mongoUri: require("../config/env").mongoUri.replace(/\/\/([^@/]+)@/, "//***@"),
      mongooseReadyState: mongooseState
    });
  })
);

// GET  api/v1/debug/user?email=...
// Returns data about a user from memory store and MongoDB (if present)
router.get(
  "/user",
  asyncHandler(async (req, res) => {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: "email query param is required" });
    }

    const normalized = String(email).toLowerCase().trim();

    // memory store lookup (sync)
    let memoryUser = null;
    try {
      memoryUser = memoryStore.findUserByEmail(normalized);
    } catch (e) {
      // ignore
    }

    // Mongo lookup (async)
    let mongoUser = null;
    let userScores = null;
    try {
      mongoUser = await User.findOne({ email: normalized }).select('-passwordHash');
      if (mongoUser) {
        userScores = await Score.find({ user: mongoUser._id }).sort({ createdAt: -1 }).limit(20).lean();
      }
    } catch (e) {
      // ignore
    }

    res.json({ success: true, memoryUser: memoryUser || null, mongoUser: mongoUser || null, scores: userScores || [] });
  })
);

// POST  api/v1/debug/migrate (body: { email })
// If a user exists in memoryStore but not in MongoDB, create it in Mongo using the same fields
router.post(
  "/migrate",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "email is required in body" });
    }

    const normalized = String(email).toLowerCase().trim();
    const memUser = memoryStore.findUserByEmail(normalized);

    if (!memUser) {
      return res.status(404).json({ success: false, message: "User not found in memory store" });
    }

    // Check if already exists in Mongo
    const exists = await User.findOne({ email: normalized });
    if (exists) {
      return res.status(409).json({ success: false, message: "User already exists in MongoDB" });
    }

    // Create in Mongo using the same passwordHash stored in memory store
    const payload = {
      name: memUser.name,
      email: memUser.email,
      passwordHash: memUser.passwordHash,
      role: memUser.role || "user",
      accountType: memUser.accountType || "user",
      contactNumber: memUser.contactNumber || null,
      image: memUser.image || null
    };

    const created = await User.create(payload);

    res.json({ success: true, created });
  })
);

module.exports = router;
