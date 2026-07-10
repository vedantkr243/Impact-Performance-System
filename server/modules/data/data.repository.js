const { isUsingMemoryStore } = require("../../config/database");
const memoryDataStore = require("../../dev/memoryDataStore");
const memoryStore = require("../../dev/memoryStore");
const PlatformContent = require("./models/platform-content.model");
const Charity = require("./models/charity.model");
const Draw = require("./models/draw.model");
const DrawEntry = require("./models/draw-entry.model");
const RewardItem = require("./models/reward-item.model");
const Achievement = require("./models/achievement.model");
const UserAchievement = require("./models/user-achievement.model");
const WalletTransaction = require("./models/wallet-transaction.model");
const UserActivity = require("./models/user-activity.model");
const PrizePoolRule = require("./models/prize-pool-rule.model");
const SignupCharity = require("./models/signup-charity.model");
const RewardHistory = require("./models/reward-history.model");
const drawTestService = require("../../services/draw-test.service");
const Score = require("../../models/Score");
const Winning = require("../../models/Winning");
const Finance = require("../../models/Finance");
const User = require("../../models/auth.model");
const Subscription = require("../billing/billing.model");
const { ACTIVE_SUBSCRIPTION_STATUSES } = require("../billing/billing.constants");
const staticData = require("../static/static.data");

const useMemory = () => isUsingMemoryStore();

const formatCurrency = (amount) =>
  `$${Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

async function getContent(key) {
  if (useMemory()) return memoryDataStore.getPlatformContent(key);
  const doc = await PlatformContent.findOne({ key }).lean();
  return doc?.value || null;
}

async function getCharities() {
  if (useMemory()) {
    return memoryDataStore.getCharities().map((item) => ({
      id: item.slug || item._id,
      name: item.name,
      focus: item.focus,
      impact: item.impact,
      mood: item.mood
    }));
  }

  const rows = await Charity.find({ active: true }).sort({ createdAt: 1 }).lean();
  return rows.map((item) => ({
    id: item.slug,
    name: item.name,
    focus: item.focus,
    impact: item.impact,
    mood: item.mood
  }));
}

async function getPrizePoolRules() {
  if (useMemory()) return memoryDataStore.getPrizePoolRules();
  return PrizePoolRule.find().sort({ sortOrder: 1 }).lean();
}

async function getSignupCharityNames() {
  if (useMemory()) {
    return memoryDataStore.getSignupCharities().map((item) => item.name).filter(Boolean);
  }

  const rows = await SignupCharity.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const signupNames = rows.map((item) => item.name).filter(Boolean);
  if (signupNames.length) return signupNames;

  const charities = await Charity.find({ active: true }).sort({ createdAt: 1 }).lean();
  const charityNames = charities.map((item) => item.name).filter(Boolean);
  if (charityNames.length) return charityNames;

  return staticData.signup?.charities || [];
}

async function countUsers() {
  if (useMemory()) return memoryDataStore.countUsers();
  return User.countDocuments();
}

async function countActiveSubscriptions() {
  if (useMemory()) return memoryDataStore.countActiveSubscriptions();
  return Subscription.countDocuments({ status: { $in: ACTIVE_SUBSCRIPTION_STATUSES } });
}

async function countVerifiedWinners() {
  if (useMemory()) return memoryDataStore.getWinnings().filter((item) => item.status === "verified").length;
  return Winning.countDocuments({ status: "verified" });
}

async function sumVerifiedWinnings() {
  if (useMemory()) {
    return memoryDataStore.getWinnings().reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  const rows = await Winning.aggregate([
    { $match: { status: "verified" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return rows[0]?.total || 0;
}

async function countCharities() {
  if (useMemory()) return memoryDataStore.getCharities().length;
  return Charity.countDocuments({ active: true });
}

async function countOpenDraws() {
  if (useMemory()) {
    const openDraws = memoryDataStore.getDraws().filter((draw) => draw.status === "open");
    return openDraws.some((draw) => draw.isFeatured) ? 1 : openDraws.length;
  }

  const openDraws = await Draw.find({ status: "open" }).lean();
  return openDraws.some((draw) => draw.isFeatured) ? 1 : openDraws.length;
}

async function getLatestFinance() {
  if (useMemory()) return memoryDataStore.getFinance();
  return Finance.findOne().sort({ createdAt: -1 }).lean();
}

async function getUserScores(userId) {
  if (!userId) return [];
  if (useMemory()) {
    return memoryDataStore.getScores(userId).map((item) => ({
      label: item.label,
      score: item.score,
      date: item.date
    }));
  }
  const rows = await Score.find({ user: userId, status: "approved" }).sort({ date: -1 }).limit(12).lean();
  return rows.map((item) => ({
    label: item.label || new Date(item.date).toLocaleString("en-US", { month: "short", day: "numeric" }),
    score: item.score,
    date: item.date,
    activityType: item.activityType || "Golf Round",
    weather: item.weather || "Sunny",
    notes: item.notes || ""
  }));
}

/**
 * Compute how many consecutive calendar days (ending today) the user
 * has logged at least one score.  Returns a formatted string like
 * "7 days", "1 day", or "—" when no scores exist.
 */
async function computePlayingStreak(userId) {
  if (!userId) return "—";

  let dates;
  if (useMemory()) {
    dates = memoryDataStore.getScores(userId).map((s) => s.date).filter(Boolean);
  } else {
    const rows = await Score.find({ user: userId, status: "approved" }, { date: 1 }).sort({ date: -1 }).lean();
    dates = rows.map((r) => r.date);
  }

  if (!dates.length) return "—";

  // Normalise each date to midnight UTC so different times on the same day collapse
  const daySet = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}-${dt.getUTCDate()}`;
    })
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const check = new Date(today);
    check.setUTCDate(today.getUTCDate() - i);
    const key = `${check.getUTCFullYear()}-${check.getUTCMonth()}-${check.getUTCDate()}`;
    if (daySet.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow missing today (player hasn't played yet today) but break on any older gap
      if (i === 1) continue;
      break;
    }
  }

  if (streak === 0) return "—";
  return streak === 1 ? "1 day" : `${streak} days`;
}

async function getUserWinningsTotal(userId) {
  if (!userId) return 0;
  if (useMemory()) {
    return memoryDataStore
      .getWinnings(userId)
      .filter((item) => item.status === "verified")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  const rows = await Winning.aggregate([
    { $match: { user: userId, status: "verified" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return rows[0]?.total || 0;
}

async function getWalletTransactions(userId) {
  if (!userId) return [];
  if (useMemory()) {
    return memoryDataStore.getWalletTransactions(userId).map((item) => ({
      label: item.label,
      value: item.value,
      tone: item.tone
    }));
  }
  const rows = await WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
  return rows.map((item) => ({
    label: item.label,
    value: item.value,
    tone: item.tone
  }));
}

async function getUserActivities(userId) {
  const query = userId ? { $or: [{ userId }, { userId: null }] } : { userId: null };
  if (useMemory()) {
    return memoryDataStore.getUserActivities(userId).map((item) => ({
      type: item.type,
      label: item.label,
      time: item.timeLabel
    }));
  }
  const rows = await UserActivity.find(query).sort({ createdAt: -1 }).limit(10).lean();
  return rows.map((item) => ({
    type: item.type,
    label: item.label,
    time: item.timeLabel
  }));
}

async function getDrawsPayload(userId) {
  const content = (await getContent("draws")) || {};
  let featured;
  let upcoming;
  let myEntries = [];
  let previousResults = content.previousResults || [];
  let winners = content.winners || [];

  const liveDrawStatus = await drawTestService.getActiveDrawStatus(userId);

  if (liveDrawStatus.active && liveDrawStatus.draw) {
    featured = {
      _id: liveDrawStatus.draw.id,
      title: liveDrawStatus.draw.title,
      prize: liveDrawStatus.draw.prize,
      drawDate: liveDrawStatus.draw.drawDate,
      status: liveDrawStatus.draw.status,
      isFeatured: true,
      prizeBreakdown: [
        { name: "Jackpot (5 matches)", value: 40, color: "#0F766E" },
        { name: "4-Number Match", value: 35, color: "#14B8A6" },
        { name: "3-Number Match", value: 25, color: "#22C55E" }
      ],
      analytics: {
        participants: liveDrawStatus.participantCount,
        averageEntries: 1,
        largestPrize: liveDrawStatus.draw.prize,
        impact: liveDrawStatus.poolContribution,
        trend: []
      }
    };

    if (liveDrawStatus.myEntry) {
      myEntries = [{
        id: liveDrawStatus.myEntry.entryCode,
        numbers: liveDrawStatus.myEntry.numbers,
        planCode: liveDrawStatus.myEntry.planCode
      }];
    }

    upcoming = [];
  } else if (liveDrawStatus.lastResults) {
    previousResults = [{
      id: liveDrawStatus.lastResults.drawId,
      draw: liveDrawStatus.lastResults.title || "Test Draw",
      date: liveDrawStatus.lastResults.settledAt || liveDrawStatus.lastResults.drawDate,
      numbers: liveDrawStatus.lastResults.winningNumbers,
      prize: `$${Number(liveDrawStatus.lastResults.totalPool || 0).toFixed(2)}`,
      winner: liveDrawStatus.lastResults.winners.find((item) => item.matchCount === 5)?.name || "--",
      status: "Completed"
    }];
    winners = liveDrawStatus.lastResults.winners.map((winner, index) => ({
      id: `${winner.userId}-${index}`,
      name: winner.name,
      amount: `$${Number(winner.prizeAmount || 0).toFixed(2)}`,
      draw: liveDrawStatus.lastResults.title || "Test Draw"
    }));
  }

  if (!featured) {
    if (useMemory()) {
      featured = memoryDataStore.getFeaturedDraw();
      upcoming = memoryDataStore.getDraws().filter((draw) => !draw.isFeatured);
      myEntries = memoryDataStore.getDrawEntries(userId).map((entry) => ({
        id: entry.entryCode,
        numbers: entry.numbers
      }));
    } else {
      featured = await Draw.findOne({ isFeatured: true }).lean();
      upcoming = await Draw.find({ isFeatured: false }).sort({ drawDate: 1 }).lean();
      if (userId && featured) {
        const entries = await DrawEntry.find({ userId, drawId: featured._id }).lean();
        myEntries = entries.map((entry) => ({ id: entry.entryCode, numbers: entry.numbers }));
      }
    }
  }

  let participantsCount = 0;
  if (featured) {
    if (liveDrawStatus.active) {
      participantsCount = liveDrawStatus.participantCount;
    } else if (useMemory()) {
      participantsCount = memoryDataStore.getDrawEntriesByDrawId?.(featured._id)?.length || 0;
    } else {
      participantsCount = (await DrawEntry.distinct("userId", { drawId: featured._id })).length;
      if (participantsCount === 0) {
        participantsCount = await countActiveSubscriptions();
      }
    }
  }
  const openDrawCount = await countOpenDraws();

  const latestFinance = await getLatestFinance();
  const totalPoolValue = latestFinance ? latestFinance.rewardPool : 6240;

  const drawsStats = [
    { label: "Active Draws", value: openDrawCount, icon: "Gift" },
    { label: "Total Participants", value: participantsCount.toLocaleString(), icon: "Users" },
    { label: "Draw Pool Value", value: formatCurrency(totalPoolValue), icon: "Wallet" },
    { label: "Your Entries", value: myEntries.length, icon: "Ticket" }
  ];

  return {
    hero: featured
      ? {
          name: featured.title,
          prize: featured.prize,
          entries: myEntries.length || content.hero?.entries || 0,
          countdown: featured.countdown || content.hero?.countdown || {},
          drawDate: featured.drawDate,
          endsAt: featured.drawDate || featured.endsAt || content.hero?.endsAt
        }
      : content.hero,
    stats: drawsStats,
    upcoming: upcoming.map((draw) => ({
      id: draw._id,
      title: draw.title,
      prize: draw.prize,
      fee: draw.entryFee,
      date: draw.drawDate
        ? new Date(draw.drawDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          })
        : draw.drawDate,
      status: draw.status ? draw.status[0].toUpperCase() + draw.status.slice(1) : "Open"
    })),
    myEntries,
    prizeBreakdown: featured?.prizeBreakdown || content.prizeBreakdown || [],
    previousResults,
    winners,
    analytics: featured?.analytics || content.analytics || null,
    testDraw: liveDrawStatus
  };
}


function getLoyaltyTier(points) {
  const tiers = [
    { name: "Platinum", min: 5000, nextGoal: 5000 },
    { name: "Gold", min: 2500, nextGoal: 5000 },
    { name: "Silver", min: 1000, nextGoal: 2500 },
    { name: "Bronze", min: 0, nextGoal: 1000 }
  ];

  return tiers.find((tier) => points >= tier.min) || tiers[tiers.length - 1];
}

function getAchievementUnlocked(title, context) {
  const normalized = String(title || "").toLowerCase();

  if (normalized.includes("first") && normalized.includes("performance")) return context.scoreCount >= 1;
  if (normalized.includes("10") && (normalized.includes("entry") || normalized.includes("performance"))) return context.scoreCount >= 10 || context.drawEntryCount >= 10;
  if (normalized.includes("charity")) return context.charityImpact > 0;
  if (normalized.includes("win") || normalized.includes("reward")) return context.winningsTotal > 0 || context.rewardCount > 0;
  if (normalized.includes("consistency")) return context.scoreCount >= 5;

  return false;
}
async function getRewardsPayload(userId) {
  const content = (await getContent("rewards")) || {};
  let featured = [];
  let marketplace = [];
  let achievements = [];
  let history = [];
  let drawEntryCount = 0;

  const scores = userId ? await getUserScores(userId) : [];
  const winningsTotal = userId ? await getUserWinningsTotal(userId) : 0;
  const subscription = userId && !useMemory()
    ? await Subscription.findOne({ userId }).sort({ createdAt: -1 }).lean()
    : null;
  const charityImpact = Number(subscription?.charityRevenueShare || 0);

  if (useMemory()) {
    featured = memoryDataStore.getRewardItems("featured");
    marketplace = memoryDataStore.getRewardItems("marketplace");
    history = memoryDataStore.getRewardHistory(userId);
    drawEntryCount = memoryDataStore.getDrawEntries(userId).length;
    const context = {
      scoreCount: scores.length,
      drawEntryCount,
      charityImpact,
      winningsTotal,
      rewardCount: history.length
    };
    achievements = memoryDataStore.getAchievements().map((item) => ({
      id: item._id,
      title: item.title,
      pts: item.points,
      unlocked: item.unlocked || getAchievementUnlocked(item.title, context)
    }));
  } else {
    featured = await RewardItem.find({ kind: "featured", active: true }).lean();
    marketplace = await RewardItem.find({ kind: "marketplace", active: true }).lean();
    const achievementRows = await Achievement.find({ active: true }).lean();
    const unlockedIds = userId
      ? new Set(
          (
            await UserAchievement.find({ userId, unlocked: true }).lean()
          ).map((item) => String(item.achievementId))
        )
      : new Set();
    drawEntryCount = userId ? await DrawEntry.countDocuments({ userId }) : 0;
    if (userId) {
      history = await RewardHistory.find({ userId }).sort({ createdAt: -1 }).lean();
    }
    const context = {
      scoreCount: scores.length,
      drawEntryCount,
      charityImpact,
      winningsTotal,
      rewardCount: history.length
    };
    achievements = achievementRows.map((item, index) => ({
      id: item._id || index + 1,
      title: item.title,
      pts: item.points,
      unlocked: unlockedIds.has(String(item._id)) || getAchievementUnlocked(item.title, context)
    }));
  }

  if (!achievements.length) {
    achievements = [
      { id: "first-performance", title: "First Performance Entry", pts: 100, unlocked: scores.length >= 1 },
      { id: "consistent-player", title: "Consistency Builder", pts: 250, unlocked: scores.length >= 5 },
      { id: "charity-supporter", title: "Charity Supporter", pts: 150, unlocked: charityImpact > 0 },
      { id: "reward-winner", title: "Reward Winner", pts: 300, unlocked: winningsTotal > 0 }
    ];
  }

  const unlockedAchievementPoints = achievements
    .filter((item) => item.unlocked)
    .reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const activityPoints = scores.length * 50 + drawEntryCount * 25;
  const charityPoints = Math.floor(charityImpact * 10);
  const winningPoints = Math.floor(winningsTotal);
  const points = activityPoints + charityPoints + winningPoints + unlockedAchievementPoints;
  const tierInfo = getLoyaltyTier(points);
  const balance = winningsTotal > 0 ? formatCurrency(winningsTotal) : "$0.00";
  const redeemedPoints = history.reduce((sum, item) => sum + Number(item.points || 0), 0);

  return {
    wallet: {
      balance,
      lifetime: formatCurrency(winningsTotal + redeemedPoints),
      redeemed: redeemedPoints ? `${redeemedPoints.toLocaleString()} pts` : "0 pts",
      tier: tierInfo.name,
      points,
      tierGoal: tierInfo.nextGoal,
      rewardsEarned: history.length,
      charityImpact: formatCurrency(charityImpact),
      charityPointsRate: 10,
      scorePointsRate: 50
    },
    featured: featured.map((item, index) => ({
      id: item._id || index + 1,
      image: item.image,
      title: item.title,
      value: item.value,
      points: item.points,
      badge: item.badge
    })),
    marketplace: marketplace.map((item, index) => ({
      id: item._id || index + 1,
      title: item.title,
      points: item.points,
      stock: item.stock
    })),
    achievements,
    history,
    recommendations: marketplace.slice(0, 3).map((item, index) => ({
      id: item._id || index + 1,
      title: item.title,
      points: item.points
    }))
  };
}
function calculateConsistencyRating(scores) {
  if (!scores.length) return "—";

  const average = scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
  const variance = scores.reduce((sum, item) => sum + Math.pow(item.score - average, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - standardDeviation * 2)));

  return `${stabilityScore}%`;
}

async function getPerformancePayload(userId) {
  const content = (await getContent("performance")) || {};
  const scores = await getUserScores(userId);
  const trendData =
    scores.length > 0
      ? [...scores].reverse().map((item) => ({
          month: item.label,
          score: item.score
        }))
      : content.trendData || [];

  const recentScores = scores.slice(0, 5).map((item) => ({
    date: item.label,
    score: item.score
  }));

  const historyRows = scores.map((item, index) => {
    const previousScore = index < scores.length - 1 ? scores[index + 1].score : null;
    const trend = previousScore == null
      ? "Stable"
      : item.score < previousScore
        ? "Improved"
        : item.score > previousScore
          ? "Declined"
          : "Stable";

    return {
      date: item.label || new Date(item.date).toLocaleString("en-US", { month: "short", day: "numeric" }),
      score: item.score,
      type: item.activityType || "Golf Round",
      weather: item.weather || "Sunny",
      notes: item.notes || "",
      trend
    };
  });

  const average =
    scores.length > 0
      ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(0)
      : "—";

  const bestScore = scores.length > 0 ? Math.min(...scores.map((item) => item.score)) : "—";
  const consistencyRating = calculateConsistencyRating(scores);

  return {
    ...content,
    trendData,
    historyRows,
    breakdownData: content.breakdownData || [],
    recommendations: content.recommendations || [],
    summaryCards: (content.summaryCards || []).map((card, index) => {
      if (index === 0) return { ...card, value: String(average) };
      if (index === 1) return { ...card, value: String(bestScore) };
      if (index === 2) return { ...card, value: String(scores.length) };
      if (index === 3) return { ...card, value: consistencyRating };
      return card;
    }),
    recentScores,
    fallbackScores: recentScores.length ? recentScores : content.fallbackScores || []
  };
}


async function getDashboardPayload(userId) {
  const content = (await getContent("dashboard")) || {};
  const charities = await getCharities("charity");
  const scores = await getUserScores(userId);
  const transactions = await getWalletTransactions(userId);
  const activities = await getUserActivities(userId);
  const winningsTotal = userId ? await getUserWinningsTotal(userId) : 0;
  const openDraws = await countOpenDraws();
  const playingStreak = await computePlayingStreak(userId);

  const subscription = userId
    ? (useMemory()
        ? memoryStore.findSubscriptionByUserId(userId)
        : await Subscription.findOne({ userId }).sort({ createdAt: -1 }).lean())
    : null;
  const isSubscribed = subscription && ["active", "authenticated", "created", "pending"].includes(subscription.status);

  let userCharityImpact = "$0.00";
  if (isSubscribed) {
    const share = subscription.charityRevenueShare || (subscription.planCode === "yearly" ? 12.4 : 1.2);
    userCharityImpact = `$${Number(share).toFixed(2)}`;
  }

  const baseScoreHistory = scores.length ? scores : content.baseScoreHistory || [];
  const recentScores = scores.slice(0, 5).map((item) => ({ date: item.label, score: item.score }));
  const averageScore =
    scores.length > 0
      ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(2)
      : content.kpis?.impactScore || "—";

  const featuredDraw = useMemory()
    ? memoryDataStore.getFeaturedDraw()
    : await Draw.findOne({ isFeatured: true }).lean();

  const drawDate = featuredDraw ? featuredDraw.drawDate : null;
  const endsAtDate = drawDate && new Date(drawDate).getTime() < Date.now()
    ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    : drawDate;

  return {
    charities,
    baseScoreHistory,
    fallbackScores: recentScores.length ? recentScores : content.fallbackScores || [],
    recentScores: recentScores.length ? recentScores : content.recentScores || [],
    transactions: transactions.length ? transactions : content.transactions || [],
    activities: activities.length ? activities : content.activities || [],
    aiInsights: content.aiInsights || [],
    revenueSplit: content.revenueSplit || [],
    kpis: {
      impactScore: averageScore,
      streak: playingStreak,
      rewardsWon: winningsTotal > 0 ? formatCurrency(winningsTotal) : content.kpis?.rewardsWon || "$0",
      activeDraws: openDraws,
      charityImpact: userCharityImpact
    },
    nextDraw: featuredDraw
      ? {
          title: featuredDraw.title.replace("2025", "2026"),
          countdown: featuredDraw.countdown || content.nextDraw?.countdown || {},
          endsAt: endsAtDate
        }
      : content.nextDraw,
    walletBalance:
      winningsTotal > 0 ? `${formatCurrency(winningsTotal)}.00` : content.walletBalance || "$0.00",
    charityImpactTotal: userCharityImpact,
    platformShare: content.platformShare || "20%"
  };
}

async function getHomePayload() {
  const content = (await getContent("home")) || {};
  const [totalUsers, winnersCount, rewardsTotal, causesCount] = await Promise.all([
    countUsers(),
    countVerifiedWinners(),
    sumVerifiedWinnings(),
    countCharities()
  ]);

  return {
    ...content,
    trustMetrics: [
      { icon: "Users", value: `${totalUsers.toLocaleString()}+`, label: "Active Users" },
      { icon: "Trophy", value: `${winnersCount.toLocaleString()}+`, label: "Winners Rewarded" },
      { icon: "Gift", value: `${formatCurrency(rewardsTotal)}+`, label: "Rewards Distributed" },
      { icon: "HeartHandshake", value: "20%", label: "Revenue to Impact" },
      { icon: "Globe2", value: `${causesCount}+`, label: "Causes Supported" }
    ]
  };
}

async function getAdminPayload() {
  const [totalUsers, activeSubscriptions, finance, poolRules, charityContent] = await Promise.all([
    countUsers(),
    countActiveSubscriptions(),
    getLatestFinance(),
    getPrizePoolRules(),
    getContent("charity")
  ]);

  return {
    stats: [
      { label: "Total Users", value: String(totalUsers), note: "Live from database" },
      { label: "Active Subscriptions", value: String(activeSubscriptions), note: "Live from database" },
      {
        label: "Charity Pool",
        value: formatCurrency(finance?.charityPool || 0),
        note: "From finance records"
      },
      {
        label: "Prize Pool",
        value: formatCurrency(finance?.rewardPool || 0),
        note: "Auto-calculated"
      }
    ],
    poolRules,
    charitySteps: charityContent?.steps || [],
    charityOverview: charityContent?.overviewSteps || [],
    recentActivity: [
      `${totalUsers} registered users on platform`,
      `${activeSubscriptions} active subscriptions`,
      `Charity pool at ${formatCurrency(finance?.charityPool || 0)}`
    ]
  };
}

module.exports = {
  getContent,
  getUserScores,
  getCharities,
  getPrizePoolRules,
  getSignupCharityNames,
  getDrawsPayload,
  getRewardsPayload,
  getPerformancePayload,
  getDashboardPayload,
  getHomePayload,
  getAdminPayload,
  countUsers,
  countActiveSubscriptions,
  computePlayingStreak
};
