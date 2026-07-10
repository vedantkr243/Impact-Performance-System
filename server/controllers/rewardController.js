const User = require("../models/User");
const Score = require("../models/Score");
const Finance = require("../models/Finance");
const Winning = require("../models/Winning");

/**
 * Monthly Reward Cycle Controller
 * Implements the core logic for generating winning numbers,
 * matching them against user scores, and assigning rewards.
 */
exports.evaluateMonthlyRewards = async (req, res) => {
    try {
        // Step 1: System generates winning numbers
        // In a real-world scenario, this might be triggered by a CRON job 
        // and winning numbers would be generated on the server.
        const winningNumbers = req.body.winningNumbers || [28, 30, 10, 5, 1];

        if (!Array.isArray(winningNumbers) || winningNumbers.length !== 5) {
            return res.status(400).json({
                success: false,
                message: "The monthly cycle requires exactly 5 winning numbers."
            });
        }

        // Convert winning numbers to a Set for efficient matching
        const winningSet = new Set(winningNumbers.map(Number));

        // Fetch the current pool status
        const now = new Date();
        const currentFinance = await Finance.findOne({
            cycleMonth: now.getMonth(),
            cycleYear: now.getFullYear()
        });

        const totalPoolValue = currentFinance ? currentFinance.rewardPool : 0;

        // Fetch all active/approved users with their last 5 scores using aggregation for scalability
        const usersWithScores = await User.aggregate([
            { $match: { approved: true } },
            {
                $lookup: {
                    from: "scores",
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 }
                    ],
                    as: "recentScores"
                }
            }
        ]);
        
        const cycleResults = usersWithScores.map(user => {
            const scoresList = user.recentScores.map(s => s.score);
            const userSet = new Set(scoresList);
            
            // Calculate matches (unique scores hitting winning numbers)
            let matches = 0;
            userSet.forEach(score => {
                if (winningSet.has(score)) {
                    matches++;
                }
            });

            // Step 3: Decide reward based on match count
            let reward = "No reward";
            if (matches === 5) {
                reward = "Jackpot";
            } else if (matches === 4) {
                reward = "Medium";
            } else if (matches === 3) {
                reward = "Small";
            }
            // Matches <= 2 result in "No reward"

            return {
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email
                },
                scores: scoresList,
                matches,
                reward
            };
        });

        // Calculate Payout Splits
        // We define how the 70% reward pool is partitioned between tiers
        const TIER_ALLOCATION = {
            Jackpot: 0.50, // 50% of the pool
            Medium: 0.30,  // 30% of the pool
            Small: 0.20    // 20% of the pool
        };

        const winnersCount = {
            Jackpot: cycleResults.filter(r => r.reward === "Jackpot").length,
            Medium: cycleResults.filter(r => r.reward === "Medium").length,
            Small: cycleResults.filter(r => r.reward === "Small").length
        };

        // Calculate individual prize amounts (Split equally among winners of the same tier)
        const prizeAmounts = {
            Jackpot: winnersCount.Jackpot > 0 ? (totalPoolValue * TIER_ALLOCATION.Jackpot) / winnersCount.Jackpot : 0,
            Medium: winnersCount.Medium > 0 ? (totalPoolValue * TIER_ALLOCATION.Medium) / winnersCount.Medium : 0,
            Small: winnersCount.Small > 0 ? (totalPoolValue * TIER_ALLOCATION.Small) / winnersCount.Small : 0
        };

        // Add prize amounts to results and calculate total distributed
        let totalDistributed = 0;
        cycleResults.forEach(result => {
            result.amountWon = prizeAmounts[result.reward] || 0;
            totalDistributed += result.amountWon;
        });

        // Persist Winnings to DB for tracking and verification
        const winningsToCreate = cycleResults
            .filter(res => res.reward !== "No reward")
            .map(res => ({
                user: res.user.id,
                amount: res.amountWon,
                cycleMonth: now.getMonth(),
                cycleYear: now.getFullYear(),
                rewardTier: res.reward,
                status: "pending_proof"
            }));

        if (winningsToCreate.length > 0) {
            await Winning.insertMany(winningsToCreate);
        }

        return res.status(200).json({
            success: true,
            cycleDate: new Date(),
            winningNumbers,
            poolInfo: {
                totalRewardPool: totalPoolValue,
                totalDistributed,
                remainingInPool: totalPoolValue - totalDistributed, // Surplus if some tiers had no winners
                charityImpact: currentFinance ? currentFinance.charityPool : 0,
                currency: "USD"
            },
            cycleResults
        });

    } catch (error) {
        console.error("Reward Cycle Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal error during reward evaluation cycle",
            error: error.message
        });
    }
};
