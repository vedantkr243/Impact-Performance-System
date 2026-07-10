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
const Finance = require("../../models/Finance");
const Score = require("../../models/Score");
const Winning = require("../../models/Winning");
const User = require("../../models/auth.model");
const { isUsingMemoryStore } = require("../../config/database");
const memoryDataStore = require("../../dev/memoryDataStore");
const staticData = require("../static/static.data");

const PLATFORM_KEYS = [
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
];

async function seedPlatformContent() {
  for (const key of PLATFORM_KEYS) {
    const exists = await PlatformContent.findOne({ key });
    if (!exists && staticData[key]) {
      await PlatformContent.create({ key, value: staticData[key] });
    }
  }
}

async function seedCharities() {
  const count = await Charity.countDocuments();
  if (count > 0) return;
  const list = staticData.CHARITIES || [];
  for (const item of list) {
    await Charity.create({
      slug: item.id,
      name: item.name,
      focus: item.focus,
      impact: item.impact,
      mood: item.mood,
      active: true
    });
  }
}

async function seedPrizePoolRules() {
  const count = await PrizePoolRule.countDocuments();
  if (count > 0) return;
  const list = staticData.PRIZE_POOL_RULES || [];
  for (const item of list) {
    await PrizePoolRule.create(item);
  }
}

async function seedSignupCharities() {
  const count = await SignupCharity.countDocuments();
  if (count > 0) return;
  const signupNames = staticData.signup?.charities || [];
  for (let i = 0; i < signupNames.length; i++) {
    await SignupCharity.create({
      name: signupNames[i],
      sortOrder: i,
      active: true
    });
  }
}

async function seedDraws() {
  const count = await Draw.countDocuments();
  if (count > 0) return;
  
  // Featured draw
  const featured = staticData.draws.hero;
  if (featured) {
    await Draw.create({
      slug: "mega-summer-2026",
      title: featured.name,
      prize: featured.prize,
      entryFee: "Free",
      status: "open",
      isFeatured: true,
      countdown: featured.countdown,
      drawDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
  }

  // Upcoming draws
  const upcomingList = staticData.draws.upcoming || [];
  for (const item of upcomingList) {
    await Draw.create({
      slug: `draw-${item.id}`,
      title: item.title,
      prize: item.prize,
      entryFee: item.fee,
      drawDate: new Date(item.date),
      status: item.status.toLowerCase(),
      isFeatured: false
    });
  }
}

async function seedRewards() {
  const count = await RewardItem.countDocuments();
  if (count > 0) return;
  const featuredList = staticData.rewards.featured || [];
  for (const item of featuredList) {
    await RewardItem.create({
      image: item.image,
      title: item.title,
      value: item.value,
      points: item.points,
      badge: item.badge,
      kind: "featured",
      active: true
    });
  }
  const marketplaceList = staticData.rewards.marketplace || [];
  for (const item of marketplaceList) {
    await RewardItem.create({
      title: item.title,
      points: item.points,
      stock: item.stock,
      kind: "marketplace",
      active: true
    });
  }
}

async function seedFinance() {
  const count = await Finance.countDocuments();
  if (count > 0) return;

  await Finance.create({
    totalRevenue: 26400,
    rewardPool: 6240,
    charityPool: 18420,
    platformPool: 2640
  });
}

async function seedDatabase() {
  if (isUsingMemoryStore()) {
    // Seed memory store with static data fallback so dev/demo users get mock stats, scores, and winnings
    memoryDataStore.seedFromStatic(staticData);
    return { seeded: true, mode: "memory" };
  }

  await seedPlatformContent();
  await seedCharities();
  await seedPrizePoolRules();
  await seedSignupCharities();
  await seedDraws();
  await seedRewards();
  await seedFinance();

  return { seeded: true, mode: "mongodb" };
}

module.exports = { seedDatabase };
