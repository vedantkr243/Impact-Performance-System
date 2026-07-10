const Finance = require("../models/Finance");
const { isUsingMemoryStore } = require("../config/database");
const memoryDataStore = require("../dev/memoryDataStore");

const POOL_CONTRIBUTION_RATE = 0.8;
const CHARITY_RATE = 0.1;
const PLATFORM_RATE = 0.1;

const getCurrentCycle = () => {
  const now = new Date();
  return { cycleMonth: now.getMonth(), cycleYear: now.getFullYear() };
};

const getOrCreateCurrentFinance = async () => {
  const { cycleMonth, cycleYear } = getCurrentCycle();

  if (isUsingMemoryStore()) {
    return memoryDataStore.getOrCreateFinance();
  }

  let finance = await Finance.findOne({ cycleMonth, cycleYear });
  if (!finance) {
    finance = await Finance.create({ cycleMonth, cycleYear });
  }
  return finance;
};

const recordSubscriptionRevenue = async (planAmount) => {
  const amount = Number(planAmount) || 0;
  if (amount <= 0) {
    return getOrCreateCurrentFinance();
  }

  const increments = {
    totalRevenue: amount,
    rewardPool: amount * POOL_CONTRIBUTION_RATE,
    charityPool: amount * CHARITY_RATE,
    platformPool: amount * PLATFORM_RATE
  };

  if (isUsingMemoryStore()) {
    return memoryDataStore.incrementFinance(increments);
  }

  const { cycleMonth, cycleYear } = getCurrentCycle();
  return Finance.findOneAndUpdate(
    { cycleMonth, cycleYear },
    { $inc: increments },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const deductRewardPool = async (amount) => {
  const deduction = Number(amount) || 0;
  if (deduction <= 0) {
    return getOrCreateCurrentFinance();
  }

  if (isUsingMemoryStore()) {
    return memoryDataStore.incrementFinance({ rewardPool: -deduction });
  }

  const { cycleMonth, cycleYear } = getCurrentCycle();
  return Finance.findOneAndUpdate(
    { cycleMonth, cycleYear },
    { $inc: { rewardPool: -deduction } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getRewardPoolBalance = async () => {
  const finance = await getOrCreateCurrentFinance();
  return finance?.rewardPool || 0;
};

module.exports = {
  POOL_CONTRIBUTION_RATE,
  getOrCreateCurrentFinance,
  recordSubscriptionRevenue,
  deductRewardPool,
  getRewardPoolBalance
};
