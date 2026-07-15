const crypto = require("crypto");
const ApiError = require("../utils/api-error");
const Draw = require("../modules/data/models/draw.model");
const DrawEntry = require("../modules/data/models/draw-entry.model");
const Winning = require("../models/Winning");
const Score = require("../models/Score");
const User = require("../models/auth.model");
const { isUsingMemoryStore } = require("../config/database");
const memoryDataStore = require("../dev/memoryDataStore");

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const generateUniqueNumbers = (count = 5, min = 1, max = 45) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

const createDraw = async ({ title, description, startDate, endDate, prizeBreakdown, totalPool }) => {
  if (!title || !startDate || !endDate) {
    throw new ApiError(400, "Title, startDate, and endDate are required.");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw new ApiError(400, "Start date must be before end date.");
  }

  // Generate 5 random numbers (1-45)
  const randomNumbers = generateUniqueNumbers(5, 1, 45);

  const drawPayload = {
    slug: `draw-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    title,
    description: description || "",
    prize: "$0.00",
    drawDate: end,
    startedAt: start,
    status: "open",
    mode: "production",
    totalPool: 0,
    randomNumber: randomNumbers, // Now array of 5 numbers
    isFeatured: false,
    entryFee: "Free with subscription",
    prizeBreakdown: prizeBreakdown || [
      { name: "Jackpot (5 matches)", value: 40, color: "#0F766E" },
      { name: "4-Number Match", value: 35, color: "#14B8A6" },
      { name: "3-Number Match", value: 25, color: "#22C55E" }
    ],
    analytics: {
      participants: 0,
      averageEntries: 1,
      largestPrize: "$0.00",
      impact: "80% of subscription revenue funds this pool",
      trend: []
    }
  };

  if (isUsingMemoryStore()) {
    return memoryDataStore.createDraw(drawPayload);
  }

  return await Draw.create(drawPayload);
};

const listAllDraws = async ({ status, page = 1, limit = 10 } = {}) => {
  if (isUsingMemoryStore()) {
    const allDraws = memoryDataStore.getDraws() || [];
    const filtered = status ? allDraws.filter((d) => d.status === status) : allDraws;
    const start = (page - 1) * limit;
    return {
      draws: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit
    };
  }

  const query = status ? { status } : {};
  const draws = await Draw.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await Draw.countDocuments(query);

  return {
    draws,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };
};

const getDraw = async (drawId) => {
  if (isUsingMemoryStore()) {
    const draw = memoryDataStore.getDrawById(drawId);
    if (!draw) {
      throw new ApiError(404, "Draw not found.");
    }
    return draw;
  }

  const draw = await Draw.findById(drawId).lean();
  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }
  return draw;
};

const deleteDraw = async (drawId) => {
  if (isUsingMemoryStore()) {
    memoryDataStore.deleteDraw?.(drawId);
    return;
  }

  const draw = await Draw.findById(drawId);
  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  if (draw.status === "completed") {
    throw new ApiError(400, "Cannot delete a completed draw.");
  }

  // Delete associated entries
  await DrawEntry.deleteMany({ drawId });

  // Delete the draw
  await Draw.findByIdAndDelete(drawId);
};

const settleMonthlyDraw = async (drawId) => {
  let draw;
  if (isUsingMemoryStore()) {
    draw = memoryDataStore.getDrawById(drawId);
  } else {
    draw = await Draw.findById(drawId);
  }

  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  // Get all entries for this draw
  let entries = [];
  if (isUsingMemoryStore()) {
    entries = memoryDataStore.getDrawEntriesByDrawId(drawId) || [];
  } else {
    entries = await DrawEntry.find({ drawId: draw._id }).populate("userId").lean();
  }

  // If already completed, only skip if prizes were actually distributed
  if (draw.status === "completed") {
    const alreadyPaid = entries.some((e) => (e.prizeAmount || 0) > 0);
    if (alreadyPaid) {
      throw new ApiError(400, "Draw is already completed and prizes have been distributed.");
    }
    // Otherwise fall through — draw was marked completed but prizes were never sent
    // (e.g. settled before prize-distribution code was deployed)
  }

  const TIER_SHARES = {
    5: 0.40, // 40% to Jackpot
    4: 0.35, // 35% to 4-number match
    3: 0.25  // 25% to 3-number match
  };

  const TIER_LABELS = {
    5: "Jackpot",
    4: "4-Number Match",
    3: "3-Number Match"
  };

  // Get the 5 winning numbers from draw (stored in randomNumber as array)
  const winningNumbers = Array.isArray(draw.randomNumber) 
    ? draw.randomNumber 
    : generateUniqueNumbers(5, 1, 45);

  // For each user entry, get their latest 5 scores and count matches
  const evaluatedEntries = [];

  for (const entry of entries) {
    let userScores = [];

    if (isUsingMemoryStore()) {
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

    // Save userScores as entry.numbers in DB
    if (isUsingMemoryStore()) {
      memoryDataStore.updateDrawEntry(entry._id, { numbers: userScores });
    } else {
      await DrawEntry.findByIdAndUpdate(entry._id, { numbers: userScores });
    }
    entry.numbers = userScores;

    // Count matches between user's top 5 scores and winning numbers
    const winningSet = new Set(winningNumbers.map(Number));
    const matchCount = userScores.filter((score) => winningSet.has(Number(score))).length;

    evaluatedEntries.push({
      ...entry,
      userScores,
      matchCount
    });
  }

  // 1. Group entries by subscription plan tier
  const monthlyEntries = [];
  const yearlyEntries = [];

  evaluatedEntries.forEach((entry) => {
    const plan = String(entry.planCode || "monthly").toLowerCase();
    if (plan.includes("yearly") || plan.includes("annual")) {
      yearlyEntries.push(entry);
    } else {
      monthlyEntries.push(entry);
    }
  });

  // Calculate dynamic pools (80% of subscription value)
  const monthlyPool = monthlyEntries.length * 12 * 0.8;
  const yearlyPool = yearlyEntries.length * 124 * 0.8;
  const totalPool = monthlyPool + yearlyPool;

  // Group winners by tier inside each group
  const monthlyWinnersByTier = { 5: [], 4: [], 3: [] };
  monthlyEntries.forEach((entry) => {
    if (entry.matchCount >= 3) {
      monthlyWinnersByTier[entry.matchCount].push(entry);
    }
  });

  const yearlyWinnersByTier = { 5: [], 4: [], 3: [] };
  yearlyEntries.forEach((entry) => {
    if (entry.matchCount >= 3) {
      yearlyWinnersByTier[entry.matchCount].push(entry);
    }
  });

  // Calculate prizes and distribute
  const winners = [];
  let totalDistributed = 0;

  // Monthly winners distribution
  [5, 4, 3].forEach((tier) => {
    const tierPool = monthlyPool * TIER_SHARES[tier];
    const tierWinners = monthlyWinnersByTier[tier];

    if (tierWinners.length > 0) {
      const individualPrize = tierPool / tierWinners.length;
      tierWinners.forEach((winner) => {
        winners.push({
          userId: winner.userId?._id || winner.userId,
          userName: winner.userId?.name || "Winner",
          userScores: winner.userScores,
          amount: individualPrize,
          tier: TIER_LABELS[tier],
          matchCount: winner.matchCount,
          entryCode: winner.entryCode,
          planCode: "monthly"
        });
        totalDistributed += individualPrize;
      });
    }
  });

  // Yearly winners distribution
  [5, 4, 3].forEach((tier) => {
    const tierPool = yearlyPool * TIER_SHARES[tier];
    const tierWinners = yearlyWinnersByTier[tier];

    if (tierWinners.length > 0) {
      const individualPrize = tierPool / tierWinners.length;
      tierWinners.forEach((winner) => {
        winners.push({
          userId: winner.userId?._id || winner.userId,
          userName: winner.userId?.name || "Winner",
          userScores: winner.userScores,
          amount: individualPrize,
          tier: TIER_LABELS[tier],
          matchCount: winner.matchCount,
          entryCode: winner.entryCode,
          planCode: "yearly"
        });
        totalDistributed += individualPrize;
      });
    }
  });

  // Create Winning records, WalletTransaction records, and update DrawEntry records
  const now = new Date();
  for (const w of winners) {
    if (isUsingMemoryStore()) {
      memoryDataStore.addWinning({
        user: String(w.userId),
        amount: w.amount,
        cycleMonth: now.getMonth(),
        cycleYear: now.getFullYear(),
        rewardTier: w.tier,
        status: "verified"
      });

      memoryDataStore.addWalletTransaction({
        userId: String(w.userId),
        label: `Draw Prize: ${draw.title}`,
        value: `+$${Number(w.amount).toFixed(2)}`,
        tone: "text-emerald-500",
        amount: w.amount
      });
      
      const userEntry = entries.find((e) => String(e.userId) === String(w.userId));
      if (userEntry) {
        memoryDataStore.updateDrawEntry(userEntry._id, {
          matchCount: w.matchCount,
          prizeAmount: w.amount,
          tier: w.tier
        });
      }
    } else {
      await Winning.create({
        user: w.userId,
        amount: w.amount,
        cycleMonth: now.getMonth(),
        cycleYear: now.getFullYear(),
        rewardTier: w.tier,
        status: "verified"
      });

      const WalletTransaction = require("../modules/data/models/wallet-transaction.model");
      await WalletTransaction.create({
        userId: w.userId,
        label: `Draw Prize: ${draw.title}`,
        value: `+$${Number(w.amount).toFixed(2)}`,
        tone: "text-emerald-500",
        amount: w.amount
      });

      const userEntry = entries.find((e) => String(e.userId?._id || e.userId) === String(w.userId));
      if (userEntry) {
        await DrawEntry.findByIdAndUpdate(userEntry._id, {
          matchCount: w.matchCount,
          prizeAmount: w.amount,
          tier: w.tier
        });
      }
    }
  }

  // Determine winnerName to show in Previous Draw results
  const jackpotWinner = winners.find((w) => w.matchCount === 5);
  const winnerName = jackpotWinner 
    ? jackpotWinner.userName 
    : winners.length > 0 
    ? winners.map((w) => w.userName).slice(0, 2).join(", ") + (winners.length > 2 ? "..." : "")
    : "No Winner";

  const formattedPrize = `$${Number(totalPool).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const drawUpdate = {
    status: "completed",
    settledAt: now,
    winningNumbers,
    totalPool,
    prize: formattedPrize,
    winnerName,
    analytics: {
      ...draw.analytics,
      participants: entries.length,
      largestPrize: winners.length > 0 ? `$${Math.max(...winners.map(w => w.amount)).toFixed(2)}` : "$0.00"
    }
  };

  // Update draw status
  if (isUsingMemoryStore()) {
    memoryDataStore.updateDraw(drawId, drawUpdate);
  } else {
    await Draw.findByIdAndUpdate(drawId, drawUpdate);
  }

  return {
    drawId,
    totalPool,
    totalDistributed,
    winnersCount: winners.length,
    winningNumbers,
    winners,
    settledAt: new Date()
  };
};

module.exports = {
  createDraw,
  listAllDraws,
  getDraw,
  deleteDraw,
  settleMonthlyDraw
};
