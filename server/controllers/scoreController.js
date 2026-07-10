const Score = require("../models/Score");
const memoryStore = require("../dev/memoryStore");
const UserActivity = require("../modules/data/models/user-activity.model");
const { isUsingMemoryStore } = require("../config/database");
const memoryDataStore = require("../dev/memoryDataStore");
const { saveUploadedFile } = require("../utils/fileUpload");
const User = require("../models/auth.model");

const ensureAdmin = (req) => {
    if (req.user?.role !== "admin") {
        throw new Error("Admin access required.");
    }
};

exports.addScore = async (req, res) => {
    try {
        const { score, label } = req.body;
        const userId = req.user.id;

        if (score === undefined) {
            return res.status(400).json({
                success: false,
                message: "Score value is required",
            });
        }

        // Verify photo proof is uploaded
        if (!req.files || (!req.files.proof && !req.files.file)) {
            return res.status(400).json({
                success: false,
                message: "Photo proof (screenshot) of the scorecard is required."
            });
        }

        const proofFile = req.files.proof || req.files.file;
        const { uploadImage } = require("../utils/fileUpload");
        const imageUrl = await uploadImage(proofFile, "proofs");

        // Stored in Score model with "pending" status and linked to user
        const newScore = await Score.create({
            user: userId,
            score: Number(score),
            label: label || new Date().toLocaleString("en-US", { month: "short", day: "numeric" }),
            image: imageUrl,
            status: "pending" // requires admin approval
        });

        // 3. Log a UserActivity so the Recent Activity feed shows real events (pending review)
        try {
            if (!isUsingMemoryStore() && !memoryDataStore.isActive()) {
                await UserActivity.create({
                    userId,
                    type: "score",
                    label: `Submitted score of ${Number(score)} for verification`,
                    timeLabel: "just now"
                });
            }
        } catch (actErr) {
            console.warn("Failed to log score activity:", actErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Performance score submitted successfully. Pending Admin verification.",
            score: newScore,
        });
    } catch (error) {
        console.error("Add Score Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while submitting performance score",
            error: error.message,
        });
    }
};

exports.getPendingScores = async (req, res) => {
    try {
        ensureAdmin(req);
        const pendingList = await Score.find({ status: "pending" })
            .populate("user", "name email image")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: pendingList
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message || "Admin access required.",
        });
    }
};

exports.approveScore = async (req, res) => {
    try {
        ensureAdmin(req);
        const score = await Score.findById(req.params.id);
        if (!score) {
            return res.status(404).json({ success: false, message: "Score not found." });
        }
        score.status = "approved";
        const scores=await User.findByIdAndUpdate(
  score.user,
  {
    $push: {
      scores: score._id
    }
  },
  { new: true }
);
        await score.save();
        return res.status(200).json({ success: true, message: "Score approved.", data: score });
    } catch (error) {
        return res.status(403).json({ success: false, message: error.message || "Unable to approve score." });
    }
};

exports.rejectScore = async (req, res) => {
    try {
        ensureAdmin(req);
        const score = await Score.findById(req.params.id);
        if (!score) {
            return res.status(404).json({ success: false, message: "Score not found." });
        }
        score.status = "rejected";
        await score.save();
        return res.status(200).json({ success: true, message: "Score rejected.", data: score });
    } catch (error) {
        return res.status(403).json({ success: false, message: error.message || "Unable to reject score." });
    }
};

exports.getScoreAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch the last 5 approved scores to perform analysis
        const scores = await Score.find({ user: userId, status: "approved" }).sort({ createdAt: -1 }).limit(5);

        if (scores.length < 2) {
            return res.status(200).json({
                success: true,
                insights: ["Log at least 2 scores to unlock AI analysis!"],
                trajectory: "0%"
            });
        }

        const values = scores.map(s => s.score).reverse(); // Sort oldest to newest for trend analysis
        const latest = values[values.length - 1];
        const oldest = values[0];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;

        const insights = [];

        // 1. Performance Trajectory Analysis
        const improvement = ((latest - oldest) / (oldest || 1)) * 100;
        insights.push(`Your performance ${improvement >= 0 ? 'improved' : 'declined'} ${Math.abs(improvement).toFixed(1)}% compared to your first session.`);

        // 2. Consistency Analysis (using Coefficient of Variation)
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / (mean || 1); // Consistency ratio

        if (cv < 0.1) insights.push("Your consistency is exceptionally high.");
        else if (cv < 0.2) insights.push("Your consistency is high.");
        else insights.push("Your scores show high volatility; try focusing on stability.");

        // 3. Time-based Patterns (Weekend vs Weekday)
        const weekendScores = scores.filter(s => {
            const day = new Date(s.date).getDay();
            return day === 0 || day === 6; // Sunday or Saturday
        });
        const weekdayScores = scores.filter(s => {
            const day = new Date(s.date).getDay();
            return day !== 0 && day !== 6;
        });

        if (weekendScores.length > 0 && weekdayScores.length > 0) {
            const avgWeekend = weekendScores.reduce((a, b) => a + b.score, 0) / weekendScores.length;
            const avgWeekday = weekdayScores.reduce((a, b) => a + b.score, 0) / weekdayScores.length;

            if (avgWeekend > avgWeekday + 2) insights.push("You perform significantly better on weekends.");
            else if (avgWeekday > avgWeekend + 2) insights.push("You show better focus during the week.");
        }

        return res.status(200).json({
            success: true,
            insights,
            trajectory: `${improvement >= 0 ? '+' : ''}${improvement.toFixed(0)}%`,
            highestScore: Math.max(...values),
            averageScore: mean.toFixed(1)
        });
    } catch (error) {
        console.error("Score Analysis Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while generating insights",
            error: error.message
        });
    }
};

