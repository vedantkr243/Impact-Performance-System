const asyncHandler = require("../utils/async-handler");
const drawAdminService = require("../services/draw-admin.service");
const { isUsingMemoryStore } = require("../config/database");
const memoryDataStore = require("../dev/memoryDataStore");
const memoryStore = require("../dev/memoryStore");

// ─── helpers ─────────────────────────────────────────────────────────────────
const generateEntryCode = () =>
  `ENT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const generateNumbers = () => {
  const nums = new Set();
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 49) + 1);
  return [...nums].sort((a, b) => a - b);
};

const ACTIVE_SUB_STATUSES = ["active", "authenticated", "created", "pending"];

const getUserSubscription = async (userId) => {
  if (isUsingMemoryStore()) {
    // In memory mode every logged-in user gets a mock monthly subscription for dev
    return { planCode: "monthly", status: "active" };
  }
  const Subscription = require("../modules/billing/billing.model");
  return Subscription.findOne({ userId, status: { $in: ACTIVE_SUB_STATUSES } })
    .sort({ createdAt: -1 })
    .lean();
};

// ─── GET  api/v1/draws ────────────────────────────────────────────────────────
// Users: only "open" draws OR draws they entered | Admins: all draws
exports.listDraws = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === "admin";

  const result = await drawAdminService.listAllDraws({ limit: 100 });
  const draws = result?.draws || [];

  const userId = String(req.user._id || req.user.id || req.user.sub);

  // Fetch entries for the current user to find matches
  let userEntries = [];
  if (isUsingMemoryStore()) {
    userEntries = memoryDataStore.getDrawEntries(userId) || [];
  } else {
    const DrawEntry = require("../modules/data/models/draw-entry.model");
    userEntries = await DrawEntry.find({ userId }).lean();
  }
  const userEntryMap = Object.fromEntries(userEntries.map((e) => [String(e.drawId), e]));

  // Enrich draws with participant counts, live prize pool, and user entry info
  let enriched = await Promise.all(
    draws.map(async (d) => {
      const userEntry = userEntryMap[String(d._id || d.id)];
      
      // Fetch all entries for this draw
      let drawEntries = [];
      if (isUsingMemoryStore()) {
        drawEntries = memoryDataStore.getDrawEntriesByDrawId(d._id || d.id) || [];
      } else {
        const DrawEntry = require("../modules/data/models/draw-entry.model");
        drawEntries = await DrawEntry.find({ drawId: d._id || d.id }).lean();
      }

      // Calculate pool dynamically: 80% of subscription value ($12/monthly, $124/yearly)
      let livePool = 0;
      if (d.status === "open") {
        let monthlyCount = 0;
        let yearlyCount = 0;
        drawEntries.forEach((entry) => {
          const plan = String(entry.planCode || "monthly").toLowerCase();
          if (plan.includes("yearly") || plan.includes("annual")) {
            yearlyCount++;
          } else {
            monthlyCount++;
          }
        });
        livePool = monthlyCount * 12 * 0.8 + yearlyCount * 124 * 0.8;
      } else {
        livePool = d.totalPool || 0;
      }

      const formattedPrize = `$${Number(livePool).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      return {
        ...d,
        prize: formattedPrize,
        totalPool: livePool,
        participantCount: drawEntries.length,
        hasEntered: !!userEntry,
        myEntry: userEntry
          ? {
              entryCode: userEntry.entryCode,
              numbers: userEntry.numbers || [],
              planCode: userEntry.planCode,
              prizeAmount: userEntry.prizeAmount || 0,
              tier: userEntry.tier || null,
              matchCount: userEntry.matchCount || 0
            }
          : null
      };
    })
  );

  // Filter for regular users: show only open draws, completed draws, OR draws they participated in
  if (!isAdmin) {
    enriched = enriched.filter((d) => d.status === "open" || d.status === "completed" || d.hasEntered);
  }

  res.json({ success: true, data: { draws: enriched } });
});

// ─── POST  api/v1/draws/:id/enter ─────────────────────────────────────────────
exports.enterDraw = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = String(req.user._id || req.user.id || req.user.sub);

  // Get draw
  const draw = await drawAdminService.getDraw(id);
  if (draw.status !== "open") {
    return res.status(400).json({ success: false, message: "This draw is no longer accepting entries." });
  }

  // Check subscription
  const sub = await getUserSubscription(userId);
  if (!sub) {
    return res.status(403).json({
      success: false,
      message: "You need an active subscription to enter this draw.",
      requiresSubscription: true,
      requiredPlan: draw.requiredPlan || "any"
    });
  }

  // Check if user has an active entry slot (isActive === true)
  let user;
  if (isUsingMemoryStore()) {
    user = memoryStore.findUserById(userId);
  } else {
    const User = require("../models/auth.model");
    user = await User.findById(userId);
  }

  if (!user || !user.isActive) {
    return res.status(403).json({
      success: false,
      message: "You have already used your subscription entry. Please purchase/renew a subscription to enter another draw.",
      requiresSubscription: true,
      requiredPlan: draw.requiredPlan || "any"
    });
  }

  // Check plan tier gate
  const required = draw.requiredPlan || "any";
  if (required === "yearly" && sub.planCode !== "yearly") {
    return res.status(403).json({
      success: false,
      message: "This draw requires a Yearly subscription. Please upgrade to enter.",
      requiresSubscription: true,
      requiredPlan: required
    });
  }
  if (required === "monthly" && !["monthly", "yearly"].includes(sub.planCode)) {
    return res.status(403).json({
      success: false,
      message: "This draw requires at least a Monthly subscription.",
      requiresSubscription: true,
      requiredPlan: required
    });
  }

  // Duplicate check
  let existing = null;
  if (isUsingMemoryStore()) {
    existing = memoryDataStore.findDrawEntry(userId, id);
  } else {
    const DrawEntry = require("../modules/data/models/draw-entry.model");
    existing = await DrawEntry.findOne({ userId, drawId: id }).lean();
  }

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "You have already entered this draw.",
      entry: existing
    });
  }

  const entryPayload = {
    userId,
    drawId: id,
    entryCode: generateEntryCode(),
    numbers: generateNumbers(),
    planCode: sub.planCode
  };

  let entry;
  if (isUsingMemoryStore()) {
    entry = memoryDataStore.createDrawEntry(entryPayload);
    // Update participant count in the draw analytics
    const currentDraw = memoryDataStore.getDrawById(id);
    if (currentDraw) {
      memoryDataStore.updateDraw(id, {
        analytics: {
          ...(currentDraw.analytics || {}),
          participants: (currentDraw.analytics?.participants || 0) + 1
        }
      });
    }
    // Set user isActive to false in memory store
    if (user) {
      user.isActive = false;
    }
  } else {
    const DrawEntry = require("../modules/data/models/draw-entry.model");
    entry = await DrawEntry.create(entryPayload);
    // Set user isActive to false in database
    const User = require("../models/auth.model");
    await User.findByIdAndUpdate(userId, { isActive: false });
  }

  res.status(201).json({ success: true, message: "Entry confirmed!", data: entry });
});

// ─── GET  api/v1/draws/:id/details (admin only) ───────────────────────────────
exports.getDrawDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const draw = await drawAdminService.getDraw(id);

  let entries = [];
  if (isUsingMemoryStore()) {
    const rawEntries = memoryDataStore.getDrawEntriesByDrawId(id) || [];
    entries = rawEntries.map((e) => {
      // Look up user from memory store
      const user = memoryStore.getUserById?.(e.userId) || null;
      return {
        _id: e._id,
        entryCode: e.entryCode,
        numbers: e.numbers || [],
        planCode: e.planCode || "monthly",
        prizeAmount: e.prizeAmount || 0,
        tier: e.tier || null,
        user: {
          _id: e.userId,
          name: user?.name || "Demo User",
          email: user?.email || "demo@example.com"
        }
      };
    });
  } else {
    const DrawEntry = require("../modules/data/models/draw-entry.model");
    const raw = await DrawEntry.find({ drawId: id }).populate("userId", "name email").lean();
    entries = raw.map((e) => ({
      _id: e._id,
      entryCode: e.entryCode,
      numbers: e.numbers || [],
      planCode: e.planCode || "--",
      prizeAmount: e.prizeAmount || 0,
      tier: e.tier || null,
      user: {
        _id: e.userId?._id,
        name: e.userId?.name || "Unknown",
        email: e.userId?.email || "--"
      }
    }));
  }

  const winner = entries.find((e) => e.prizeAmount > 0) || null;

  res.json({
    success: true,
    data: {
      draw,
      entries,
      totalParticipants: entries.length,
      winner: winner
        ? {
            name: winner.user?.name || draw.winnerName || "Unknown",
            email: winner.user?.email || "--",
            entryCode: winner.entryCode,
            numbers: winner.numbers,
            prize: winner.prizeAmount
          }
        : draw.winnerName
        ? { name: draw.winnerName, entryCode: "--", numbers: draw.winningNumbers || [], prize: "--" }
        : null
    }
  });
});

// ─── PUT  api/v1/draws/:id (admin: update requiredPlan, status, etc.) ─────────
exports.updateDraw = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let updated;
  if (isUsingMemoryStore()) {
    updated = memoryDataStore.updateDraw(id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Draw not found." });
  } else {
    const Draw = require("../modules/data/models/draw.model");
    updated = await Draw.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Draw not found." });
  }

  res.json({ success: true, data: updated });
});

// ─── POST  api/v1/draws (admin: create draw) ──────────────────────────────────
exports.createDraw = asyncHandler(async (req, res) => {
  const draw = await drawAdminService.createDraw(req.body);
  res.status(201).json({ success: true, data: draw });
});

// ─── DELETE  api/v1/draws/:id (admin) ─────────────────────────────────────────
exports.deleteDraw = asyncHandler(async (req, res) => {
  await drawAdminService.deleteDraw(req.params.id);
  res.json({ success: true, message: "Draw deleted." });
});
