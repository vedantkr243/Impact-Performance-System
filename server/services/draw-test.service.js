const crypto = require("crypto");
const env = require("../config/env");
const ApiError = require("../utils/api-error");
const { isUsingMemoryStore } = require("../config/database");
const memoryDataStore = require("../dev/memoryDataStore");
const Draw = require("../modules/data/models/draw.model");
const DrawEntry = require("../modules/data/models/draw-entry.model");
const Winning = require("../models/Winning");
const User = require("../models/auth.model");
const Subscription = require("../modules/billing/billing.model");
const { ACTIVE_SUBSCRIPTION_STATUSES } = require("../modules/billing/billing.constants");
const financeService = require("./finance.service");
const memoryStore = require("../dev/memoryStore");

const TEST_DRAW_DURATION_MS = env.testDrawDurationMs;
const NUMBER_COUNT = 5;
const NUMBER_MIN = 1;
const NUMBER_MAX = 49;

const TIER_SHARES = {
  5: 0.4,
  4: 0.35,
  3: 0.25
};

const TIER_LABELS = {
  5: "Jackpot",
  4: "4-Number Match",
  3: "3-Number Match"
};

const settleTimers = new Map();

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const generateUniqueNumbers = (count = NUMBER_COUNT) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (NUMBER_MAX - NUMBER_MIN + 1)) + NUMBER_MIN);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

const countMatches = (entryNumbers, winningNumbers) => {
  const winningSet = new Set(winningNumbers.map(Number));
  return entryNumbers.filter((number) => winningSet.has(Number(number))).length;
};

const buildEntryCode = () => `ENTRY-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const useMemory = () => isUsingMemoryStore();

const getActiveSubscription = async (userId) => {
  if (useMemory()) {
    const subscription = memoryStore.findSubscriptionByUserId?.(userId);
    return subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
      ? subscription
      : null;
  }

  return Subscription.findOne({
    userId,
    status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
  }).sort({ createdAt: -1 });
};

const getOpenTestDraw = async () => {
  if (useMemory()) {
    return memoryDataStore.getOpenTestDraw();
  }

  return Draw.findOne({ mode: "test", status: "open" }).sort({ createdAt: -1 });
};

const scheduleAutoSettle = (drawId) => {
  const key = String(drawId);
  if (settleTimers.has(key)) {
    clearTimeout(settleTimers.get(key));
  }

  const timer = setTimeout(async () => {
    try {
      await settleDraw(drawId);
      console.log(`[draw-test] Auto-settled draw ${drawId}`);
    } catch (error) {
      console.error(`[draw-test] Failed to auto-settle draw ${drawId}:`, error.message);
    } finally {
      settleTimers.delete(key);
    }
  }, TEST_DRAW_DURATION_MS);

  settleTimers.set(key, timer);
};

const startTestDraw = async ({ force = false } = {}) => {
  if (!env.prizePoolTestMode) {
    throw new ApiError(403, "Prize pool test mode is disabled.");
  }

  const existing = await getOpenTestDraw();
  if (existing && !force) {
    return serializeDraw(existing);
  }

  if (existing && force) {
    await settleDraw(existing._id);
  }

  const startedAt = new Date();
  const drawDate = new Date(startedAt.getTime() + TEST_DRAW_DURATION_MS);
  const rewardPool = await financeService.getRewardPoolBalance();
  const randomNumber = Math.floor(Math.random() * 1000000); // Generate a random number at draw start

  const drawPayload = {
    slug: `test-draw-${Date.now()}`,
    title: "30-Minute Test Draw",
    prize: formatCurrency(rewardPool),
    entryFee: "Free with subscription",
    drawDate,
    status: "open",
    isFeatured: true,
    mode: "test",
    totalPool: rewardPool,
    startedAt,
    randomNumber,
    prizeBreakdown: [
      { name: "Jackpot (5 matches)", value: 40, color: "#0F766E" },
      { name: "4-Number Match", value: 35, color: "#14B8A6" },
      { name: "3-Number Match", value: 25, color: "#22C55E" }
    ],
    analytics: {
      participants: 0,
      averageEntries: 1,
      largestPrize: formatCurrency(rewardPool * TIER_SHARES[5]),
      impact: "80% of subscription revenue funds this pool",
      trend: []
    }
  };

  let draw;
  if (useMemory()) {
    draw = memoryDataStore.createDraw(drawPayload);
  } else {
    await Draw.updateMany({ isFeatured: true, status: "open" }, { isFeatured: false });
    draw = await Draw.create(drawPayload);
  }

  scheduleAutoSettle(draw._id);
  console.log(`[draw-test] Started 30-minute test draw ${draw._id}, ends at ${drawDate.toISOString()}`);

  return serializeDraw(draw);
};

const enterUserInDraw = async (userId, { planCode } = {}) => {
  const draw = await getOpenTestDraw();
  if (!draw) {
    throw new ApiError(404, "No active test draw is running.");
  }

  if (draw.status !== "open") {
    throw new ApiError(409, "This draw is no longer accepting entries.");
  }

  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    throw new ApiError(403, "An active subscription is required to enter the draw.");
  }

  const resolvedPlanCode = planCode || subscription.planCode || "monthly";

  if (useMemory()) {
    const existing = memoryDataStore.findDrawEntry(userId, draw._id);
    if (existing) {
      return serializeEntry(existing, draw);
    }

    const entry = memoryDataStore.createDrawEntry({
      userId: String(userId),
      drawId: String(draw._id),
      entryCode: buildEntryCode(),
      numbers: [],
      planCode: resolvedPlanCode
    });

    return serializeEntry(entry, draw);
  }

  const existing = await DrawEntry.findOne({ userId, drawId: draw._id });
  if (existing) {
    return serializeEntry(existing, draw);
  }

  const entry = await DrawEntry.create({
    userId,
    drawId: draw._id,
    entryCode: buildEntryCode(),
    numbers: [],
    planCode: resolvedPlanCode
  });

  return serializeEntry(entry, draw);
};

const settleDraw = async (drawId) => {
  let draw;
  if (useMemory()) {
    draw = memoryDataStore.getDrawById(drawId);
  } else {
    draw = await Draw.findById(drawId);
  }

  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  if (draw.status === "completed") {
    return getDrawResults(drawId);
  }

  const winningNumbers = generateUniqueNumbers();
  const totalPool = await financeService.getRewardPoolBalance();

  let entries = [];
  if (useMemory()) {
    entries = memoryDataStore.getDrawEntriesByDrawId(drawId);
  } else {
    entries = await DrawEntry.find({ drawId: draw._id }).lean();
  }

  const Score = require("../models/Score");

  const evaluated = [];
  for (const entry of entries) {
    let userScores = [];
    if (useMemory()) {
      const rawScores = memoryDataStore.getScores(entry.userId) || [];
      userScores = rawScores
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, 5)
        .map((s) => s.score)
        .sort((a, b) => a - b);
    } else {
      userScores = await Score.find({ user: entry.userId, status: "approved" })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .select("score")
        .lean()
        .then((scores) => scores.map((s) => s.score).sort((a, b) => a - b));
    }

    if (!userScores.length) {
      // fallback to mock scores so the demo/test functions have something to compare
      userScores = [72, 75, 78, 80, 82];
    }

    if (useMemory()) {
      memoryDataStore.updateDrawEntry(entry._id, { numbers: userScores });
    } else {
      await DrawEntry.findByIdAndUpdate(entry._id, { numbers: userScores });
    }
    entry.numbers = userScores;

    const matches = countMatches(userScores, winningNumbers);
    evaluated.push({ ...entry, matchCount: matches });
  }

  const winnersByTier = { 5: [], 4: [], 3: [] };
  evaluated.forEach((entry) => {
    if (entry.matchCount >= 3) {
      winnersByTier[entry.matchCount].push(entry);
    }
  });

  const prizeByTier = {};
  let totalDistributed = 0;
  let rolloverAmount = 0;

  [5, 4, 3].forEach((tier) => {
    const tierPool = totalPool * TIER_SHARES[tier];
    const winners = winnersByTier[tier];
    if (!winners.length) {
      if (tier === 5) {
        rolloverAmount += tierPool;
      }
      prizeByTier[tier] = 0;
      return;
    }

    const individualPrize = tierPool / winners.length;
    prizeByTier[tier] = individualPrize;
    winners.forEach((winner) => {
      winner.prizeAmount = individualPrize;
      winner.tier = TIER_LABELS[tier];
      totalDistributed += individualPrize;
    });
  });

  const now = new Date();
  const winners = [];

  for (const entry of evaluated) {
    if (!entry.prizeAmount) {
      continue;
    }

    let userName = "Winner";
    if (useMemory()) {
      const user = memoryStore.findUserById(entry.userId);
      userName = user?.name || userName;
    } else {
      const user = await User.findById(entry.userId).select("name");
      userName = user?.name || userName;
    }

    winners.push({
      userId: entry.userId,
      name: userName,
      amount: entry.prizeAmount,
      tier: entry.tier,
      matchCount: entry.matchCount,
      numbers: entry.numbers,
      planCode: entry.planCode
    });

    if (useMemory()) {
      memoryDataStore.updateDrawEntry(entry._id, {
        matchCount: entry.matchCount,
        prizeAmount: entry.prizeAmount,
        tier: entry.tier
      });
      memoryDataStore.addWinning({
        user: entry.userId,
        amount: entry.prizeAmount,
        cycleMonth: now.getMonth(),
        cycleYear: now.getFullYear(),
        rewardTier: entry.tier,
        status: "verified"
      });
    } else {
      await DrawEntry.findByIdAndUpdate(entry._id, {
        matchCount: entry.matchCount,
        prizeAmount: entry.prizeAmount,
        tier: entry.tier
      });
      await Winning.create({
        user: entry.userId,
        amount: entry.prizeAmount,
        cycleMonth: now.getMonth(),
        cycleYear: now.getFullYear(),
        rewardTier: entry.tier,
        status: "verified"
      });
    }
  }

  const jackpotWinner = winners.find((winner) => winner.matchCount === 5);

  const drawUpdate = {
    status: "completed",
    winningNumbers,
    settledAt: now,
    totalPool,
    prize: formatCurrency(totalPool),
    winnerName: jackpotWinner?.name || null,
    prizeBreakdown: [
      { name: "Jackpot (5 matches)", value: prizeByTier[5] || 0, color: "#0F766E" },
      { name: "4-Number Match", value: prizeByTier[4] || 0, color: "#14B8A6" },
      { name: "3-Number Match", value: prizeByTier[3] || 0, color: "#22C55E" }
    ],
    analytics: {
      participants: entries.length,
      averageEntries: 1,
      largestPrize: formatCurrency(Math.max(prizeByTier[5] || 0, prizeByTier[4] || 0, prizeByTier[3] || 0)),
      impact: `${winners.length} winners from ${entries.length} entries`,
      trend: []
    }
  };

  if (useMemory()) {
    memoryDataStore.updateDraw(drawId, drawUpdate);
    if (totalDistributed > 0) {
      memoryDataStore.incrementFinance({ rewardPool: -totalDistributed });
    }
    if (rolloverAmount > 0) {
      console.log(`[draw-test] Jackpot rolled over: ${formatCurrency(rolloverAmount)}`);
    }
  } else {
    await Draw.findByIdAndUpdate(drawId, drawUpdate);
    if (totalDistributed > 0) {
      await financeService.deductRewardPool(totalDistributed);
    }
  }

  return {
    drawId: String(draw._id),
    status: "completed",
    winningNumbers,
    totalPool,
    totalDistributed,
    rolloverAmount,
    winners,
    entries: evaluated.map((entry) => ({
      userId: String(entry.userId),
      numbers: entry.numbers,
      planCode: entry.planCode,
      matchCount: entry.matchCount,
      prizeAmount: entry.prizeAmount || 0,
      tier: entry.tier || null
    }))
  };
};

const getDrawResults = async (drawId) => {
  let draw;
  if (useMemory()) {
    draw = memoryDataStore.getDrawById(drawId);
  } else {
    draw = await Draw.findById(drawId).lean();
  }

  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  let entries = [];
  if (useMemory()) {
    entries = memoryDataStore.getDrawEntriesByDrawId(drawId);
  } else {
    entries = await DrawEntry.find({ drawId: draw._id }).lean();
  }

  const winners = entries
    .filter((entry) => entry.prizeAmount > 0)
    .map((entry) => ({
      userId: String(entry.userId),
      numbers: entry.numbers,
      planCode: entry.planCode,
      matchCount: entry.matchCount,
      prizeAmount: entry.prizeAmount,
      tier: entry.tier
    }));

  return {
    drawId: String(draw._id),
    status: draw.status,
    title: draw.title,
    winningNumbers: draw.winningNumbers || [],
    totalPool: draw.totalPool || 0,
    drawDate: draw.drawDate,
    settledAt: draw.settledAt || null,
    winners,
    entries: entries.map((entry) => ({
      userId: String(entry.userId),
      numbers: entry.numbers,
      planCode: entry.planCode,
      matchCount: entry.matchCount || countMatches(entry.numbers || [], draw.winningNumbers || []),
      prizeAmount: entry.prizeAmount || 0,
      tier: entry.tier || null
    }))
  };
};

const getActiveDrawStatus = async (userId = null) => {
  const draw = await getOpenTestDraw();
  const rewardPool = await financeService.getRewardPoolBalance();

  if (!draw) {
    const lastCompleted = useMemory()
      ? memoryDataStore.getLastCompletedDraw()
      : await Draw.findOne({ mode: "test", status: "completed" }).sort({ settledAt: -1 }).lean();

    return {
      active: false,
      rewardPool,
      lastDraw: lastCompleted ? serializeDraw(lastCompleted) : null,
      lastResults: lastCompleted ? await getDrawResults(lastCompleted._id) : null
    };
  }

  let myEntry = null;
  let participantCount = 0;

  if (useMemory()) {
    participantCount = memoryDataStore.getDrawEntriesByDrawId(draw._id).length;
    if (userId) {
      myEntry = memoryDataStore.findDrawEntry(userId, draw._id);
    }
  } else {
    participantCount = await DrawEntry.countDocuments({ drawId: draw._id });
    if (userId) {
      myEntry = await DrawEntry.findOne({ userId, drawId: draw._id }).lean();
    }
  }

  return {
    active: true,
    draw: serializeDraw({ ...draw, totalPool: rewardPool, prize: formatCurrency(rewardPool) }),
    rewardPool,
    participantCount,
    myEntry: myEntry ? serializeEntry(myEntry, draw) : null,
    tierRules: [
      { matches: 5, label: "Jackpot", share: "40%" },
      { matches: 4, label: "4-Number Match", share: "35%" },
      { matches: 3, label: "3-Number Match", share: "25%" }
    ],
    poolContribution: "80% of each subscription payment"
  };
};

const serializeDraw = (draw, includeRandomNumber = false) => ({
  id: String(draw._id),
  title: draw.title,
  prize: draw.prize,
  status: draw.status,
  drawDate: draw.drawDate,
  endsAt: draw.drawDate,
  startedAt: draw.startedAt,
  settledAt: draw.settledAt,
  totalPool: draw.totalPool,
  winningNumbers: draw.winningNumbers || [],
  winnerName: draw.winnerName,
  randomNumber: draw.status !== "open" || includeRandomNumber ? draw.randomNumber : undefined,
  mode: draw.mode || "test"
});

const serializeEntry = (entry, draw) => ({
  id: entry.entryCode,
  entryCode: entry.entryCode,
  numbers: entry.numbers,
  planCode: entry.planCode,
  matchCount: entry.matchCount,
  prizeAmount: entry.prizeAmount,
  tier: entry.tier,
  drawId: String(draw._id),
  drawTitle: draw.title
});

const ensureTestDrawOnBoot = async () => {
  if (!env.prizePoolTestMode) {
    return null;
  }

  const openDraw = await getOpenTestDraw();
  if (openDraw) {
    const remainingMs = new Date(openDraw.drawDate).getTime() - Date.now();
    if (remainingMs > 0) {
      scheduleAutoSettle(openDraw._id);
      return serializeDraw(openDraw);
    }

    await settleDraw(openDraw._id);
  }

  return startTestDraw();
};

const handleSubscriptionActivated = async (userId, planCode) => {
  if (!env.prizePoolTestMode) {
    return null;
  }

  const openDraw = await getOpenTestDraw();
  if (!openDraw) {
    await startTestDraw();
  }

  try {
    return await enterUserInDraw(userId, { planCode });
  } catch (error) {
    console.warn(`[draw-test] Could not auto-enter user ${userId}:`, error.message);
    return null;
  }
};

module.exports = {
  TEST_DRAW_DURATION_MS,
  TIER_SHARES,
  startTestDraw,
  getOpenTestDraw,
  enterUserInDraw,
  settleDraw,
  getDrawResults,
  getActiveDrawStatus,
  ensureTestDrawOnBoot,
  handleSubscriptionActivated,
  generateUniqueNumbers,
  countMatches,
  serializeDraw
};
