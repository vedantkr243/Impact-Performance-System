const collections = {
  platformContent: new Map(),
  charities: [],
  prizePoolRules: [],
  signupCharities: [],
  draws: [],
  drawEntries: [],
  rewardItems: [],
  achievements: [],
  walletTransactions: [],
  userActivities: [],
  rewardHistory: [],
  scores: [],
  winnings: [],
  finance: null
};

let active = false;

const getStaticFallback = () => require("../modules/static/static.data");

const clone = (value) => JSON.parse(JSON.stringify(value));

const buildSignupCharities = (staticData) => {
  const signupNames = staticData.signup?.charities || [];
  const charityNames = (staticData.CHARITIES || []).map((item) => item.name).filter(Boolean);
  const names = [...new Set([...signupNames, ...charityNames])];

  return names.map((name, index) => ({
    _id: `signup-charity-${index}`,
    name,
    sortOrder: index
  }));
};

const seedFromStatic = (staticData) => {
  active = true;
  collections.platformContent.clear();

  // If staticData is provided (legacy/dev), populate memory collections from it.
  // Otherwise initialize with empty/default collections so the runtime will rely
  // on real DB values where available.
  if (staticData) {
    for (const key of [
      "home",
      "dashboard",
      "performance",
      "draws",
      "rewards",
      "aiInsights",
      "signup",
      "signupPlans",
      "prizePool",
      "charity",
      "ui"
    ]) {
      if (staticData[key]) {
        collections.platformContent.set(key, clone(staticData[key]));
      }
    }

    collections.charities = clone(staticData.CHARITIES).map((item) => ({
      _id: item.id,
      slug: item.id,
      ...item
    }));
    collections.prizePoolRules = clone(staticData.PRIZE_POOL_RULES);
    collections.signupCharities = buildSignupCharities(staticData);

    const featuredDrawId = "draw-featured";
    collections.draws = [
      {
        _id: featuredDrawId,
        slug: "mega-summer-2026",
        title: staticData.draws.hero.name,
        prize: staticData.draws.hero.prize,
        entryFee: "Free",
        status: "open",
        isFeatured: true,
        countdown: staticData.draws.hero.countdown,
        prizeBreakdown: staticData.draws.prizeBreakdown,
        analytics: staticData.draws.analytics
      },
      ...staticData.draws.upcoming.map((item) => ({
        _id: `draw-${item.id}`,
        slug: `draw-${item.id}`,
        title: item.title,
        prize: item.prize,
        entryFee: item.fee,
        drawDate: item.date,
        status: item.status.toLowerCase(),
        isFeatured: false
      }))
    ];

    collections.drawEntries = staticData.draws.myEntries.map((entry, index) => ({
      _id: `entry-${index}`,
      userId: "demo-user",
      drawId: featuredDrawId,
      entryCode: entry.id,
      numbers: entry.numbers
    }));

    collections.rewardItems = [
      ...staticData.rewards.featured.map((item, index) => ({
        _id: `featured-${index}`,
        kind: "featured",
        ...item
      })),
      ...staticData.rewards.marketplace.map((item, index) => ({
        _id: `marketplace-${index}`,
        kind: "marketplace",
        ...item
      }))
    ];

    collections.achievements = staticData.rewards.achievements.map((item, index) => ({
      _id: `achievement-${index}`,
      title: item.title,
      points: item.pts,
      unlocked: item.unlocked
    }));

    collections.rewardHistory = staticData.rewards.history.map((item, index) => ({
      _id: `history-${index}`,
      userId: "demo-user",
      ...item
    }));

    collections.walletTransactions = staticData.dashboard.transactions.map((item, index) => ({
      _id: `txn-${index}`,
      userId: "demo-user",
      ...item
    }));

    collections.userActivities = staticData.dashboard.activities.map((item, index) => ({
      _id: `activity-${index}`,
      userId: "demo-user",
      type: item.type,
      label: item.label,
      timeLabel: item.time
    }));

    collections.scores = staticData.dashboard.baseScoreHistory.map((item, index) => ({
      _id: `score-${index}`,
      user: "demo-user",
      score: item.score,
      label: item.label,
      date: item.date
    }));

    collections.winnings = [
      { _id: "win-1", user: "demo-user", amount: 50, status: "verified" },
      { _id: "win-2", user: "demo-user", amount: 25, status: "verified" }
    ];

    collections.finance = {
      totalRevenue: 26400,
      rewardPool: 6240,
      charityPool: 18420,
      platformPool: 2640
    };
  } else {
    const fallbackData = getStaticFallback();

    if (fallbackData.signup) {
      collections.platformContent.set("signup", clone(fallbackData.signup));
    }
    if (fallbackData.dashboard) {
      collections.platformContent.set("dashboard", clone(fallbackData.dashboard));
    }

    collections.charities = clone(fallbackData.CHARITIES || []).map((item) => ({
      _id: item.id,
      slug: item.id,
      ...item
    }));
    collections.prizePoolRules = clone(fallbackData.PRIZE_POOL_RULES || []);
    collections.signupCharities = buildSignupCharities(fallbackData);
    collections.draws = [];
    collections.drawEntries = [];
    collections.rewardItems = [];
    collections.achievements = [];
    collections.rewardHistory = [];
    collections.walletTransactions = [];
    collections.userActivities = [];
    collections.scores = [];
    collections.winnings = [];
    collections.finance = { totalRevenue: 0, rewardPool: 0, charityPool: 0, platformPool: 0 };
  }
};

const isActive = () => active;
const getPlatformContent = (key) => collections.platformContent.get(key) || null;
const getCharities = () => collections.charities;
const getPrizePoolRules = () => collections.prizePoolRules;
const getSignupCharities = () => collections.signupCharities;
const getDraws = () => collections.draws;
const getFeaturedDraw = () => collections.draws.find((draw) => draw.isFeatured) || collections.draws[0];
const getDrawEntries = (userId) => {
  if (!userId) return [];
  return collections.drawEntries.filter((entry) => entry.userId === userId);
};
const getRewardItems = (kind) => collections.rewardItems.filter((item) => !kind || item.kind === kind);
const getAchievements = () => collections.achievements;
const getWalletTransactions = (userId) => {
  if (!userId) return [];
  return collections.walletTransactions.filter((entry) => entry.userId === userId);
};
const getUserActivities = (userId) => {
  if (!userId) return [];
  return collections.userActivities.filter((entry) => entry.userId === userId);
};
const getRewardHistory = (userId) => {
  if (!userId) return [];
  return collections.rewardHistory.filter((entry) => entry.userId === userId);
};
const getScores = (userId) => {
  if (!userId) return [];
  return collections.scores.filter((entry) => entry.user === userId);
};
const getWinnings = (userId) => {
  if (!userId) return [];
  return collections.winnings.filter((entry) => entry.user === userId);
};
const getFinance = () => collections.finance;

const getOrCreateFinance = () => {
  if (!collections.finance) {
    collections.finance = { totalRevenue: 0, rewardPool: 0, charityPool: 0, platformPool: 0 };
  }
  return collections.finance;
};

const incrementFinance = (increments = {}) => {
  const finance = getOrCreateFinance();
  Object.entries(increments).forEach(([key, value]) => {
    finance[key] = Number(finance[key] || 0) + Number(value || 0);
  });
  return finance;
};

const createDraw = (drawPayload) => {
  const draw = {
    _id: `draw-${Date.now()}`,
    ...drawPayload
  };
  collections.draws = collections.draws.filter((item) => !(item.mode === "test" && item.status === "open"));
  collections.draws.unshift(draw);
  return draw;
};

const updateDraw = (drawId, updates) => {
  const index = collections.draws.findIndex((draw) => String(draw._id) === String(drawId));
  if (index === -1) {
    return null;
  }
  collections.draws[index] = { ...collections.draws[index], ...updates };
  return collections.draws[index];
};

const getDrawById = (drawId) =>
  collections.draws.find((draw) => String(draw._id) === String(drawId)) || null;

const getOpenTestDraw = () =>
  collections.draws.find((draw) => draw.mode === "test" && draw.status === "open") || null;

const getLastCompletedDraw = () =>
  collections.draws.find((draw) => draw.mode === "test" && draw.status === "completed") || null;

const createDrawEntry = (entryPayload) => {
  const entry = {
    _id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...entryPayload
  };
  collections.drawEntries.push(entry);
  return entry;
};

const findDrawEntry = (userId, drawId) =>
  collections.drawEntries.find(
    (entry) => String(entry.userId) === String(userId) && String(entry.drawId) === String(drawId)
  ) || null;

const getDrawEntriesByDrawId = (drawId) =>
  collections.drawEntries.filter((entry) => String(entry.drawId) === String(drawId));

const updateDrawEntry = (entryId, updates) => {
  const index = collections.drawEntries.findIndex((entry) => String(entry._id) === String(entryId));
  if (index === -1) {
    return null;
  }
  collections.drawEntries[index] = { ...collections.drawEntries[index], ...updates };
  return collections.drawEntries[index];
};

const addWinning = (winningPayload) => {
  const winning = {
    _id: `win-${Date.now()}`,
    ...winningPayload
  };
  collections.winnings.push(winning);
  return winning;
};

const countUsers = () => {
  const memoryStore = require("./memoryStore");
  return memoryStore.countUsers?.() ?? 1;
};

const countActiveSubscriptions = () => 0;

module.exports = {
  seedFromStatic,
  isActive,
  getPlatformContent,
  getCharities,
  getPrizePoolRules,
  getSignupCharities,
  getDraws,
  getFeaturedDraw,
  getDrawEntries,
  getRewardItems,
  getAchievements,
  getWalletTransactions,
  getUserActivities,
  getRewardHistory,
  getScores,
  getWinnings,
  getFinance,
  getOrCreateFinance,
  incrementFinance,
  createDraw,
  updateDraw,
  getDrawById,
  getOpenTestDraw,
  getLastCompletedDraw,
  createDrawEntry,
  findDrawEntry,
  getDrawEntriesByDrawId,
  updateDrawEntry,
  addWinning,
  addWalletTransaction: (txPayload) => {
    const tx = {
      _id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      ...txPayload
    };
    collections.walletTransactions.push(tx);
    return tx;
  },
  countUsers,
  countActiveSubscriptions
};



