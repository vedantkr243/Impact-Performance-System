const { GoogleGenerativeAI } = require("@google/generative-ai");
const { analyzeScores } = require("./score-analytics.service");

// ─── Gemini client (lazy – only created when key is set) ─────────────────────
let geminiClient = null;

const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const normalizeMoney = (value) => {
  if (typeof value === "number") return `$${value.toFixed(2)}`;
  if (typeof value === "string") return value;
  return "$0.00";
};

const INTENT_MAP = [
  { intent: "winnings",    keywords: ["win", "reward", "prize", "draw"] },
  { intent: "suggestions", keywords: ["improve", "better", "suggest", "help me", "tip", "advice"] }
];

const classifyQuestion = (question) => {
  const q = question.toLowerCase();
  for (const entry of INTENT_MAP) {
    if (entry.keywords.some((kw) => q.includes(kw))) return entry.intent;
  }
  return "performance";
};

const summarizeWinnings = (winnings = []) => {
  const totalCount = winnings.length;
  const latest = winnings[0] || null;
  return {
    totalCount,
    latest,
    summary:
      totalCount === 0
        ? "No winnings are recorded yet, so the focus remains on qualification and consistency."
        : `You have ${totalCount} tracked winnings or reward markers, with the latest being ${latest.title}.`
  };
};

// ─── Rule-based fallback answers ─────────────────────────────────────────────
const buildPerformanceAnswer = ({ analysis, profileName }) =>
  `${profileName}, your performance trend is ${analysis.trend.direction}. Your average score is ${analysis.overview.averageScore}, your best score is ${analysis.overview.bestScore}, and the latest logged score is ${analysis.overview.latestScore}. ${analysis.trend.summary} ${analysis.consistency.summary}`;

const buildWinningsAnswer = ({ winningsSummary, subscription, profileName }) => {
  const planText = subscription?.status
    ? `Your subscription is currently ${subscription.status.toLowerCase()}`
    : "Your subscription status is not included in this request";
  const latestPrize = winningsSummary.latest
    ? ` The latest reward marker is ${winningsSummary.latest.title} for ${winningsSummary.latest.value}.`
    : "";
  return `${profileName}, ${winningsSummary.summary} ${planText}, which matters because active billing usually keeps reward eligibility flowing.${latestPrize}`;
};

const buildSuggestionAnswer = ({ analysis, charity, profileName }) => {
  const topSuggestion = analysis.suggestions[0];
  const secondSuggestion = analysis.suggestions[1];
  const charityLine = charity?.name
    ? ` Your current cause is ${charity.name}, so steadier logging also supports more predictable impact.`
    : "";
  return `${profileName}, the strongest next move is "${topSuggestion.title.toLowerCase()}": ${topSuggestion.suggestion}${secondSuggestion ? ` A second useful focus is ${secondSuggestion.suggestion.toLowerCase()}` : ""}.${charityLine}`;
};

// ─── Build context block sent to Gemini ──────────────────────────────────────
const buildSystemPrompt = ({ analysis, winningsSummary, context, profileName }) => {
  const scoreBlock = analysis
    ? `- Average score: ${analysis.overview.averageScore}
- Best score: ${analysis.overview.bestScore}
- Latest score: ${analysis.overview.latestScore}
- Trend: ${analysis.trend.direction} — ${analysis.trend.summary}
- Consistency: ${analysis.consistency.band} — ${analysis.consistency.summary}
- Top coaching suggestions: ${analysis.suggestions.map((s) => s.suggestion).join("; ")}`
    : "- No scores logged yet";

  const winBlock = winningsSummary.totalCount > 0
    ? `- ${winningsSummary.summary}`
    : "- No winnings on record";

  const subBlock = context.subscription?.status
    ? `- Subscription: ${context.subscription.status}, monthly contribution: ${normalizeMoney(context.subscription.monthlyContribution)}`
    : "- Subscription status unknown";

  const charityBlock = context.charity?.name
    ? `- Supporting charity: ${context.charity.name}`
    : "";

  return `You are an expert golf performance and charity-impact AI coach inside the Impact Performance System app.
The user's name is ${profileName}.

## User Data
${scoreBlock}
${winBlock}
${subBlock}
${charityBlock}

## Your Role
- Give concise, encouraging, data-driven coaching answers (2-4 sentences max).
- Reference specific numbers from the user data whenever relevant.
- Be warm, professional, and motivational.
- Do NOT make up statistics; only use what's in the User Data above.
- If the user has no scores yet, encourage them to log at least 3 and explain the benefit.
- Keep answers under 100 words.`;
};

// ─── Gemini call ─────────────────────────────────────────────────────────────
const askGemini = async ({ question, systemPrompt }) => {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(question);
    return result.response.text().trim();
  } catch (err) {
    console.error("[assistant] Gemini API error:", err.message);
    return null;
  }
};

// ─── Main entry ──────────────────────────────────────────────────────────────
const askAssistant = async ({ question, context, user }) => {
  const scores = Array.isArray(context?.scores) ? context.scores : [];
  const analysis = scores.length >= 3 ? analyzeScores({ scores }) : null;
  const winningsSummary = summarizeWinnings(context?.winnings || []);
  const profileName = user?.name || context?.user?.name || "there";

  const systemPrompt = buildSystemPrompt({ analysis, winningsSummary, context, profileName });

  // ── Try real Gemini first ──
  const geminiAnswer = await askGemini({ question, systemPrompt });

  if (geminiAnswer) {
    return {
      intent: "gemini",
      answer: geminiAnswer,
      poweredBy: "gemini",
      contextSummary: analysis
        ? {
            scoreAverage: analysis.overview.averageScore,
            bestScore: analysis.overview.bestScore,
            trend: analysis.trend.direction,
            consistency: analysis.consistency.band,
            winningsTracked: winningsSummary.totalCount,
            currentCharity: context?.charity?.name || null,
            subscriptionStatus: context?.subscription?.status || null,
            monthlyContribution: normalizeMoney(context?.subscription?.charityRevenueShare)
          }
        : {},
      suggestions: analysis?.suggestions || [],
      supportingInsights: {
        trend: analysis?.trend || null,
        consistency: analysis?.consistency || null,
        winnings: winningsSummary
      }
    };
  }

  // ── Rule-based fallback ──
  if (!analysis) {
    return {
      intent: "no_data",
      answer: `${profileName}, I need at least 3 approved scores to give you personalised coaching. Head to My Performance and log your rounds — I'll be ready to coach you once they're approved!`,
      poweredBy: "fallback",
      contextSummary: {},
      suggestions: [],
      supportingInsights: {}
    };
  }

  const intent = classifyQuestion(question);
  let answer;
  if (intent === "winnings") {
    answer = buildWinningsAnswer({ winningsSummary, subscription: context?.subscription, profileName });
  } else if (intent === "suggestions") {
    answer = buildSuggestionAnswer({ analysis, charity: context?.charity, profileName });
  } else {
    answer = buildPerformanceAnswer({ analysis, profileName });
  }

  return {
    intent,
    answer,
    poweredBy: "fallback",
    contextSummary: {
      scoreAverage: analysis.overview.averageScore,
      bestScore: analysis.overview.bestScore,
      trend: analysis.trend.direction,
      consistency: analysis.consistency.band,
      winningsTracked: winningsSummary.totalCount,
      currentCharity: context?.charity?.name || null,
      subscriptionStatus: context?.subscription?.status || null,
      monthlyContribution: normalizeMoney(context?.subscription?.charityRevenueShare)
    },
    suggestions: analysis.suggestions,
    supportingInsights: {
      trend: analysis.trend,
      consistency: analysis.consistency,
      winnings: winningsSummary
    }
  };
};

module.exports = { askAssistant };
