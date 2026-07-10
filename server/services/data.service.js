const dataRepository = require("../modules/data/data.repository");
const { analyzeScores } = require("./score-analytics.service");

const getHomeContent = () => dataRepository.getHomePayload();
const getDashboardContent = (userId) => dataRepository.getDashboardPayload(userId);
const getPerformanceContent = (userId) => dataRepository.getPerformancePayload(userId);
const getDrawsContent = (userId) => dataRepository.getDrawsPayload(userId);
const getRewardsContent = (userId) => dataRepository.getRewardsPayload(userId);

const round = (value) => Number(value.toFixed(0));

const getMonthLabel = (date, fallback) => {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString("en-US", { month: "short", day: "numeric" });
};

const getImprovementRate = (scores) => {
  if (scores.length < 2) return "0%";
  const first = Number(scores[0].score);
  const latest = Number(scores[scores.length - 1].score);
  if (!first) return "0%";
  const delta = ((first - latest) / first) * 100;
  return `${delta >= 0 ? "+" : ""}${Math.round(delta)}%`;
};

const getConsistencyScore = (analysis) => {
  if (!analysis) return "0%";
  const deviation = analysis.consistency?.deviation || 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - deviation * 8)));
  return `${score}%`;
};

const buildTrendData = (scores, fallback = []) => {
  if (!scores.length) return fallback;

  return scores.slice(-8).map((entry, index, list) => {
    const previous = list[index - 1]?.score ?? entry.score;
    const predicted = Math.max(1, Math.round((Number(entry.score) + Number(previous)) / 2));

    return {
      label: entry.label || getMonthLabel(entry.date, `Round ${index + 1}`),
      actual: Number(entry.score),
      predicted
    };
  });
};

const buildTrainingPlan = (analysis, scoreCount) => {
  if (!analysis || scoreCount < 3) {
    return [
      "Starter Plan",
      "Log at least 3 approved scores",
      "Use the same scoring format each round",
      "Return here for personalized AI coaching"
    ];
  }

  const focus = analysis.trend.direction === "declining"
    ? "stability reset"
    : analysis.consistency.band === "volatile"
      ? "consistency control"
      : "performance progression";

  return [
    `30-Day ${focus} plan`,
    `Week 1 - ${analysis.suggestions[0]?.title || "Baseline review"}`,
    `Week 2 - ${analysis.suggestions[1]?.title || "Controlled practice"}`,
    `Week 3 - ${analysis.suggestions[2]?.title || "Repeatable routine"}`,
    "Week 4 - Review scores and update targets"
  ];
};

const getAiInsightsContent = async (userId) => {
  const content = (await dataRepository.getContent("aiInsights")) || {};
  const scores = (await dataRepository.getUserScores(userId)).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const scoreValues = scores.map((item) => Number(item.score)).filter((value) => !Number.isNaN(value));
  
  const hasAnalysis = scoreValues.length >= 3;
  const analysis = hasAnalysis ? analyzeScores({ scores }) : null;
  const averageScore = scoreValues.length ? round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 72;
  const bestScore = scoreValues.length ? Math.min(...scoreValues) : "--";
  const worstScore = scoreValues.length ? Math.max(...scoreValues) : "--";
  const latestScore = scoreValues.length ? scoreValues[scoreValues.length - 1] : "--";
  
  const predictedScore = hasAnalysis
    ? Math.max(1, Math.round((Number(latestScore) + Number(averageScore)) / 2))
    : "--";
  const topChance = hasAnalysis ? `${Math.max(5, Math.min(95, 100 - Number(predictedScore)))}%` : "--";

  const recommendations = hasAnalysis
    ? analysis.suggestions.map((item) => item.suggestion)
    : [
        "Log at least 3 approved scores to unlock personalized AI recommendations.",
        "Add round notes in My Performance so the coach has better context.",
        "Keep your latest score history current for better predictions."
      ];

  return {
    ...content,
    quickInsights: [
      { label: "Consistency Score", value: getConsistencyScore(analysis), icon: "Target" },
      { label: "Improvement Rate", value: getImprovementRate(scores), icon: "TrendingUp" },
      { label: "Predicted Next", value: predictedScore, icon: "Brain" },
      { label: "Scores Logged", value: scoreValues.length, icon: "BarChart3" }
    ],
    trendData: buildTrendData(scores, content.trendData || []),
    recommendations,
    performanceSummary: {
      currentAverage: scoreValues.length ? averageScore : "--",
      bestScore,
      worstScore,
      mostImprovedMonth: scores.length ? getMonthLabel(scores[scores.length - 1].date, scores[scores.length - 1].label || "Latest") : "--"
    },
    predictions: {
      predictedScore,
      chanceTop5: topChance,
      expectedWins: hasAnalysis && Number(predictedScore) <= Number(bestScore) + 2 ? 1 : 0
    },
    trainingPlan: buildTrainingPlan(analysis, scoreValues.length),
    voicePrompts: content.voicePrompts || [
      "How can I improve my score?",
      "What caused my decline?",
      "Show my best month.",
      "Predict my next score."
    ],
    voiceTranscript: [],
    assistantContext: {
      canAskAssistant: hasAnalysis,
      scores: scores.map((item) => ({ score: Number(item.score), date: item.date })),
      charity: null,
      subscription: { status: "Active", monthlyContribution: 0 },
      winnings: []
    }
  };
};

const getSignupContent = async () => ({
  charities: await dataRepository.getSignupCharityNames()
});
const getSignupPlansContent = async () => dataRepository.getContent("signupPlans");
const getPrizePoolContent = async () => {
  const content = (await dataRepository.getContent("prizePool")) || {};
  return {
    ...content,
    poolRules: await dataRepository.getPrizePoolRules()
  };
};
const getCharityContent = () => dataRepository.getCharities();
const getUiContent = () => dataRepository.getContent("ui");
const getAdminContent = () => dataRepository.getAdminPayload();

module.exports = {
  getHomeContent,
  getDashboardContent,
  getPerformanceContent,
  getDrawsContent,
  getRewardsContent,
  getAiInsightsContent,
  getSignupContent,
  getSignupPlansContent,
  getPrizePoolContent,
  getCharityContent,
  getUiContent,
  getAdminContent
};
