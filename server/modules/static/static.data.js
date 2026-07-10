const PRIZE_POOL_RULES = [
  { matchType: "5-Number Match", share: "40%", rollover: "Yes (Jackpot)" },
  { matchType: "4-Number Match", share: "35%", rollover: "No" },
  { matchType: "3-Number Match", share: "25%", rollover: "Auto" }
];

const CHARITIES = [
  {
    id: "youth",
    name: "First Tee Futures",
    focus: "Youth coaching and community access",
    impact: "$148,200 deployed",
    mood: "Rising access for first-generation players"
  },
  {
    id: "water",
    name: "Clean Water Forward",
    focus: "Safe water infrastructure projects",
    impact: "$92,300 deployed",
    mood: "Steady utility funding with measurable reach"
  },
  {
    id: "mental-health",
    name: "Open Fairways Trust",
    focus: "Mental wellbeing and recovery support",
    impact: "$64,900 deployed",
    mood: "Support for resilience and recovery"
  }
];

module.exports = {
  home: {
    trustMetrics: [
      { icon: "Users", value: "1,200+", label: "Active Users" },
      { icon: "Trophy", value: "350+", label: "Winners Rewarded" },
      { icon: "Gift", value: "$25,000+", label: "Rewards Distributed" },
      { icon: "HeartHandshake", value: "20%", label: "Revenue to Impact" },
      { icon: "Globe2", value: "20+", label: "Causes Supported" }
    ],
    features: [
      { icon: "BarChart3", title: "Performance Tracking", copy: "Track your game, progress, and score trends with clear analytics." },
      { icon: "BrainCircuit", title: "AI Insights", copy: "Get personalized recommendations to improve consistency and form." },
      { icon: "Gift", title: "Rewards & Draws", copy: "Enter monthly draws, win rewards, and unlock exclusive benefits." },
      { icon: "HeartHandshake", title: "Social Impact", copy: "A portion of every payment supports meaningful causes." },
      { icon: "ShieldCheck", title: "Secure & Private", copy: "Your data is protected while your progress stays easy to access." }
    ],
    signupPlans: [
      { code: "monthly", name: "Monthly", price: "$12 / month", note: "Flexible access with monthly impact tracking" },
      { code: "yearly", name: "Yearly", price: "$124 / year", note: "Best value with annual savings and steady giving" }
    ],
    impactStats: [
      { title: "Global Scalability", description: "Platform built to handle thousands of concurrent performance logs and impact cycles." },
      { title: "Real-time Transparency", description: "Every contribution is tracked on a public-facing ledger for complete accountability." },
      { title: "Community Led", description: "Users vote on upcoming charity partners and platform feature priorities." }
    ],
    howItWorks: [
      { step: 1, title: "Sign Up & Subscribe", description: "Choose your plan and make your first contribution." },
      { step: 2, title: "Log Your Scores", description: "Enter your performance data after each session." },
      { step: 3, title: "Get AI Insights", description: "Receive personalized analysis on trends and consistency." },
      { step: 4, title: "Monthly Rewards & Impact", description: "Participate in draws and grow charity contributions." }
    ]
  },
  dashboard: {
    charities: CHARITIES,
    baseScoreHistory: [
      { label: "Jan", score: 31, date: "2026-01-12" },
      { label: "Feb", score: 35, date: "2026-02-10" },
      { label: "Mar", score: 38, date: "2026-03-18" },
      { label: "Apr", score: 42, date: "2026-04-11" },
      { label: "May", score: 40, date: "2026-05-09" },
      { label: "Jun", score: 45, date: "2026-06-14" }
    ],
    fallbackScores: [
      { label: "May 18", score: 34 },
      { label: "May 21", score: 30 },
      { label: "May 25", score: 38 },
      { label: "May 28", score: 32 },
      { label: "May 30", score: 36 }
    ],
    recentScores: [
      { date: "May 30", score: 36 },
      { date: "May 28", score: 32 },
      { date: "May 25", score: 38 },
      { date: "May 21", score: 30 },
      { date: "May 18", score: 34 }
    ],
    transactions: [
      { label: "Win #123", value: "+$50", tone: "text-emerald-600" },
      { label: "Win #122", value: "+$25", tone: "text-emerald-600" },
      { label: "Subscription", value: "-$10", tone: "text-slate-500" }
    ],
    activities: [],
    aiInsights: [
      "Consistency Improved",
      "Best Performance on Saturdays",
      "Putting Accuracy Up 12%",
      "Recommended: Practice Short Game"
    ],
    revenueSplit: [
      { label: "Charity Contribution", value: "10%", width: "10%" },
      { label: "Platform", value: "80%", width: "80%" },
      { label: "Other Causes", value: "10%", width: "10%" }
    ],
    kpis: {
      impactScore: "186.50",
      streak: "—",
      rewardsWon: "$320",
      activeDraws: 4,
      charityImpact: "$240"
    },
    nextDraw: {
      title: "Mega Draw - June 2026",
      countdown: { days: "05", hours: "14", minutes: "32", seconds: "45" }
    },
    walletBalance: "$320.00",
    charityImpactTotal: "$186.50",
    platformShare: "20%"
  },
  performance: {
    trendData: [
      { month: "Jan", score: 42 },
      { month: "Feb", score: 38 },
      { month: "Mar", score: 35 },
      { month: "Apr", score: 33 },
      { month: "May", score: 31 },
      { month: "Jun", score: 28 }
    ],
    historyRows: [
      { date: "May 30, 2025", score: 36, type: "Golf Round", weather: "Sunny", notes: "Good putting", trend: "Improved" },
      { date: "May 28, 2025", score: 32, type: "Practice Round", weather: "Cloudy", notes: "Strong approach play", trend: "Stable" },
      { date: "May 25, 2025", score: 38, type: "Golf Round", weather: "Windy", notes: "Lost strokes off tee", trend: "Declined" }
    ],
    breakdownData: [
      { name: "Driving Accuracy", value: 35, color: "#0F766E" },
      { name: "Putting", value: 30, color: "#14B8A6" },
      { name: "Short Game", value: 20, color: "#22C55E" },
      { name: "Course Management", value: 15, color: "#A7F3D0" }
    ],
    recommendations: [
      "Improve short-game consistency",
      "Focus on putting practice",
      "Your best performances happen on weekends"
    ],
    summaryCards: [
      { title: "Current Average", value: "36", subtext: "+4% from last month", icon: "BarChart3" },
      { title: "Best Score", value: "28", subtext: "Lowest round recorded", icon: "Trophy" },
      { title: "Total Entries", value: "124", subtext: "Across all activities", icon: "Target" },
      { title: "Consistency Rating", value: "92%", subtext: "Top form stability", icon: "TrendingUp" }
    ]
  },
  draws: {
    hero: { name: "Mega Summer Draw 2026", prize: "$50,000", entries: 18, endsAt: "2026-07-30T23:59:59.000Z", countdown: { days: "18", hours: "09", minutes: "27", seconds: "11" } },
    stats: [
      { label: "Active Draws", value: 4, icon: "Gift" },
      { label: "Total Entries", value: 124, icon: "Ticket" },
      { label: "Total Winnings", value: "$320", icon: "Trophy" },
      { label: "Winning Rate", value: "18%", icon: "Target" }
    ],
    upcoming: [
      { id: 1, title: "Weekly Challenge Draw", prize: "$5,000", fee: "Free", date: "July 30, 2026", status: "Open" },
      { id: 2, title: "Midweek Mini", prize: "$2,000", fee: "$2", date: "August 6, 2026", status: "Open" }
    ],
    myEntries: [
      { id: "#123", numbers: [7, 14, 23, 31, 42] },
      { id: "#124", numbers: [3, 11, 29, 37, 44] }
    ],
    prizeBreakdown: [
      { name: "1st Prize", value: 50, color: "#0F766E" },
      { name: "2nd Prize", value: 25, color: "#14B8A6" },
      { name: "3rd Prize", value: 15, color: "#22C55E" }
    ],
    previousResults: [
      { draw: "Mega Summer Draw 2026", date: "June 2026", numbers: [7, 14, 23, 31, 42], prize: "$50,000", winner: "Sarah Johnson", status: "Completed" }
    ],
    winners: [
      { name: "Sarah Johnson", amount: "$10,000", draw: "Mega Draw #122" },
      { name: "Alex Lee", amount: "$2,500", draw: "Weekly Challenge" }
    ],
    analytics: {
      participants: 5432,
      averageEntries: 8.4,
      largestPrize: "$50,000",
      impact: "$24,500",
      trend: [
        { label: "May 1", value: 4000 },
        { label: "May 8", value: 4300 },
        { label: "May 15", value: 4700 },
        { label: "May 22", value: 5000 },
        { label: "May 29", value: 5432 }
      ]
    }
  },
  rewards: {
    wallet: {
      balance: "$320.00",
      lifetime: "$1,850",
      redeemed: "$1,530",
      tier: "Gold",
      points: 2840,
      tierGoal: 4000
    },
    featured: [
      { id: 1, image: "/reward1.jpg", title: "Golf Equipment Voucher", value: "$100 Value", points: 1200, badge: "Popular" }
    ],
    marketplace: [
      { id: 1, title: "Premium Golf Balls", points: 800, stock: "In Stock" },
      { id: 2, title: "Rangefinder", points: 2200, stock: "In Stock" }
    ],
    achievements: [
      { id: 1, title: "First Performance Entry", pts: 10, unlocked: true },
      { id: 2, title: "10 Draw Entries", pts: 50, unlocked: true }
    ],
    history: [
      { date: "May 28, 2025", reward: "Golf Voucher", category: "Golf", points: 1200, status: "Redeemed" }
    ]
  },
  aiInsights: {
    quickInsights: [
      { label: "Consistency Score", value: "92%", icon: "Target" },
      { label: "Improvement Rate", value: "+11%", icon: "TrendingUp" },
      { label: "Predicted Next", value: 31, icon: "Brain" },
      { label: "Impact Generated", value: "$186", icon: "HeartHandshake" }
    ],
    trendData: [
      { label: "Week 1", actual: 36, predicted: 34 },
      { label: "Week 2", actual: 34, predicted: 33 },
      { label: "Week 3", actual: 33, predicted: 32 },
      { label: "Week 4", actual: 31, predicted: 30 }
    ],
    recommendations: [
      "Improve short game practice",
      "Focus on putting accuracy",
      "Continue weekend training",
      "Add consistency sessions"
    ],
    performanceSummary: {
      currentAverage: 36,
      bestScore: 28,
      worstScore: 44,
      mostImprovedMonth: "May"
    },
    predictions: {
      predictedScore: 31,
      chanceTop5: "84%",
      expectedWins: 2
    },
    trainingPlan: [
      "30-Day Improvement Plan",
      "Week 1 — Putting Drills",
      "Week 2 — Driving Accuracy",
      "Week 3 — Course Management",
      "Week 4 — Consistency Training"
    ],
    voicePrompts: [
      "How can I improve my score?",
      "What caused my decline?",
      "Show my best month.",
      "Predict my next score."
    ],
    voiceTranscript: [
      { role: "user", text: "How can I improve my score?" },
      { role: "ai", text: "Your biggest opportunity is improving putting consistency." }
    ]
  },
  signup: {
    charities: [
      "First Tee Foundation",
      "Youth on Course",
      "Golf Fore Africa",
      "Local Community Fund"
    ]
  },
  signupPlans: {
    plans: [
      { code: "monthly", name: "Monthly", price: "$12 / month", note: "Flexible access with monthly impact tracking" },
      { code: "yearly", name: "Yearly", price: "$124 / year", note: "Best value with annual savings and steady giving" }
    ]
  },
  prizePool: {
    poolRules: PRIZE_POOL_RULES,
    notes: [
      "Auto-calculation of each pool tier based on active subscriber count",
      "Prizes split equally among multiple winners in the same tier",
      "5-Match jackpot carries forward if unclaimed"
    ]
  },
  charity: {
    title: "How the charity process works",
    description: "Your subscription is split into predefined portions. One portion funds your selected charity, and a fixed portion contributes to the prize pool.",
    steps: [
      { title: "Subscribe", description: "Choose monthly or yearly. Your plan activates the system logic for impact + rewards." },
      { title: "Pick a cause", description: "You select a charity focus. The donation stream attaches to your subscription status." },
      { title: "Fixed split", description: "A fixed portion of each subscription goes to the prize pool automatically." },
      { title: "Transparent tracking", description: "Every cycle is tracked and calculated from active subscriber counts and plan status." }
    ],
    overviewSteps: [
      { title: "Subscription intake", description: "Each active plan contributes a fixed portion to charity and prize pools." },
      { title: "Auto-allocation", description: "Distribution is pre-defined and enforced automatically — no manual overrides." },
      { title: "Tier calculation", description: "Pool tiers scale with active subscriber count and split equally among winners." },
      { title: "Jackpot rollover", description: "5-match jackpot carries forward when unclaimed." }
    ],
    callout: {
      title: "Enforced automatically",
      description: "Distribution is pre-defined and enforced automatically. No manual overrides are needed for normal operation."
    }
  },
  ui: {
    passwordLevels: [
      { label: "Weak", min: 0 },
      { label: "Fair", min: 2 },
      { label: "Good", min: 3 },
      { label: "Strong", min: 4 }
    ]
  },
  PRIZE_POOL_RULES,
  CHARITIES
};
