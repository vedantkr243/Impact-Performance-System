import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dashboardService } from "../../services/dashboardService";
import { staticDataService } from "../../services/staticDataService";
import { DEFAULT_CHARITIES, calculateMonthlyContribution } from "../../constants/config";

const defaultDashboard = {
  charities: DEFAULT_CHARITIES,
  baseScoreHistory: [
    { label: "Jan", score: 31, date: "2026-01-12" },
    { label: "Feb", score: 35, date: "2026-02-10" },
    { label: "Mar", score: 38, date: "2026-03-18" },
    { label: "Apr", score: 42, date: "2026-04-11" },
    { label: "May", score: 40, date: "2026-05-09" },
    { label: "Jun", score: 45, date: "2026-06-14" }
  ]
};

export async function fetchDashboardStatic(token) {
  try {
    const data = await staticDataService.getDashboardStatic(token);
    return data || {};
  } catch (e) {
    console.warn("Failed to fetch dashboard static data:", e);
    return {};
  }
}

const initialState = {
  profile: {
    firstName: "",
    greeting: ""
  },
  loading: false,
  error: null,
  scoreHistory: [],
  charities: [],
  selectedCharityId: null,
  winnings: [],
  monthlyTrack: [
    { label: "Subscription", value: "0", tone: "teal" },
    { label: "To charity", value: "0", tone: "gold" },
    { label: "Reward pool", value: "0", tone: "coral" }
  ],
  subscription: {
    plan: null,
    status: null,
    renewsOn: null,
    yearlySavings: null,
    currentContribution: "0"
  },
  billingPlans: [],
  assistantNotes: [],
  analytics: null,
  kpis: null,
  aiCoachInsights: [],
  revenueSplit: [],
  charityImpactTotal: 0,
  nextDraw: null,
  walletBalance: 0,
  platformShare: 0
};

export const bootstrapDashboard = createAsyncThunk(
  "dashboard/bootstrap",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().dashboard;
      const auth = getState().auth;
      const token = auth.token;

      if (!token) {
        throw new Error("Please login to load your dashboard.");
      }

      // fetch static dashboard data (charities, base history etc.) and merge
      const staticData = await fetchDashboardStatic(token);
      const charitiesList = staticData.charities || state.charities || defaultDashboard.charities;
      const scoreHistorySource = state.scoreHistory?.length
        ? state.scoreHistory
        : staticData.baseScoreHistory || defaultDashboard.baseScoreHistory;
      const selectedCharityId = state.selectedCharityId || (charitiesList[0] && charitiesList[0].id);
      const charity = charitiesList.find((item) => item.id === selectedCharityId) || charitiesList[0];

      const me = await dashboardService.getCurrentUser(token);
      const plans = await dashboardService.getBillingPlans();
      const subscription = await dashboardService.getSubscription(token);
      const analytics = await dashboardService.getScoreAnalysis(token, scoreHistorySource).catch(() => null);
      const assistant = await dashboardService.getAssistantReply(token, {
        question: "How am I performing and what should I focus on next?",
        scores: scoreHistorySource,
        charity,
        subscription
      }).catch(() => null);

      return {
        me,
        plans,
        subscription,
        analytics,
        assistant,
        selectedPlan: auth.selectedPlan,
        staticData
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load dashboard data.");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard(state) {
      state.profile = initialState.profile;
      state.loading = false;
      state.error = null;
      state.assistantNotes = initialState.assistantNotes;
      state.subscription = initialState.subscription;
      state.monthlyTrack = initialState.monthlyTrack;
      state.billingPlans = [];
    },
    selectCharity(state, action) {
      state.selectedCharityId = action.payload;
    },
    updateSubscriptionStatus(state, action) {
      state.subscription.status = action.payload;
    },
    addScore(state, action) {
      state.scoreHistory.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bootstrapDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.profile.firstName = action.payload.me.name?.split(" ")[0] || state.profile.firstName;

        const subStatus = action.payload.subscription?.status || "Ready for activation";
        const isSubscribed = ["active", "authenticated", "created", "pending"].includes(subStatus);
        
        const planCode =
          action.payload.subscription?.planCode || action.payload.selectedPlan || "yearly";
        const selectedPlan =
          action.payload.plans?.find((plan) => plan.code === planCode) ||
          action.payload.plans?.[0];
        
        const subscriptionAmount = selectedPlan?.price
          ? `$${selectedPlan.price}`
          : planCode === "yearly"
            ? "$124"
            : "$12";

        const calculatedCharityShare = action.payload.subscription?.charityRevenueShare != null
          ? Number(action.payload.subscription.charityRevenueShare)
          : calculateMonthlyContribution(planCode);
        const formattedCharityShare = `$${calculatedCharityShare.toFixed(2)}`;

        state.subscription = {
          plan:
            planCode === "yearly"
              ? "Performance Plus Annual"
              : "Performance Plus Monthly",
          status: subStatus,
          renewsOn: action.payload.subscription?.currentPeriodEnd
            ? new Date(action.payload.subscription.currentPeriodEnd).toLocaleDateString()
            : "Set up billing to activate",
          yearlySavings: planCode === "yearly" ? "18%" : "--",
          currentContribution: isSubscribed ? formattedCharityShare : "$0.00"
        };
        state.billingPlans = action.payload.plans || [];
        state.analytics = action.payload.analytics || null;
        const hasAnalytics = !!action.payload.analytics;
        // Only set assistant notes / insights if analytics are available
        state.assistantNotes = hasAnalytics && action.payload.assistant
          ? action.payload.assistant.suggestions.map((item) => item.suggestion)
          : [];
        state.aiCoachInsights = hasAnalytics ? action.payload.staticData?.aiInsights || [] : [];
        state.revenueSplit = (hasAnalytics || isSubscribed) ? (action.payload.staticData?.revenueSplit || []) : [];
        state.kpis = {
          impactScore: hasAnalytics && action.payload.analytics?.overview?.averageScore != null
            ? Number(action.payload.analytics.overview.averageScore).toFixed(2)
            : (action.payload.staticData?.kpis?.impactScore != null ? Number(action.payload.staticData.kpis.impactScore).toFixed(2) : "0.00"),
          streak: action.payload.staticData?.kpis?.streak ?? "—",
          rewardsWon: (action.payload.staticData?.kpis?.rewardsWon != null) ? action.payload.staticData.kpis.rewardsWon : 0,
          activeDraws: action.payload.staticData?.kpis?.activeDraws ?? 0,
          charityImpact: action.payload.staticData?.kpis?.charityImpact ?? (isSubscribed ? formattedCharityShare : "$0.00")
        };

        // Use static demo values only when analytics exist
        state.charityImpactTotal = isSubscribed
          ? (action.payload.staticData?.charityImpactTotal || formattedCharityShare)
          : "$0.00";
        state.nextDraw = action.payload.staticData?.nextDraw ? action.payload.staticData.nextDraw : null;
        state.walletBalance = hasAnalytics && action.payload.staticData?.walletBalance ? action.payload.staticData.walletBalance : null;
        state.platformShare = (hasAnalytics || isSubscribed) && action.payload.staticData?.platformShare ? action.payload.staticData.platformShare : null;
        if (hasAnalytics && action.payload.staticData?.charities) {
          state.charities = action.payload.staticData.charities;
        }
        if (hasAnalytics && action.payload.staticData?.baseScoreHistory && !state.scoreHistory.length) {
          state.scoreHistory = action.payload.staticData.baseScoreHistory;
        }

        state.monthlyTrack = [
          {
            label: "Subscription",
            value: isSubscribed ? subscriptionAmount : "$0",
            tone: "teal"
          },
          { 
            label: "To charity", 
            value: isSubscribed ? formattedCharityShare : "$0.00", 
            tone: "gold" 
          },
          {
            label: "Reward pool",
            value: hasAnalytics && action.payload.assistant?.contextSummary
              ? `${action.payload.assistant.contextSummary.winningsTracked} markers`
              : "0 markers",
            tone: "coral"
          }
        ];

        if (!hasAnalytics) {
          // Clear UI sections that would otherwise display demo data for new users
          state.aiCoachInsights = [];
          state.revenueSplit = isSubscribed ? (action.payload.staticData?.revenueSplit || []) : [];
          state.assistantNotes = [];
          state.winnings = [];
          state.monthlyTrack = [
            { label: "Subscription", value: isSubscribed ? subscriptionAmount : "$0", tone: "teal" },
            { label: "To charity", value: isSubscribed ? formattedCharityShare : "$0.00", tone: "gold" },
            { label: "Reward pool", value: "0 markers", tone: "coral" }
          ];
          state.scoreHistory = [];
          state.nextDraw = null;
          state.walletBalance = null;
          state.platformShare = isSubscribed ? (action.payload.staticData?.platformShare || "20%") : null;
          state.charityImpactTotal = isSubscribed ? formattedCharityShare : null;
        }
      })
      .addCase(bootstrapDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong while loading the dashboard.";
        state.assistantNotes = [
          "Backend connection failed.",
          "Check whether your server is running on PORT5000.",
          "Then reload the dashboard to pull live data."
        ];
      });
  }
});

export const { resetDashboard, selectCharity, updateSubscriptionStatus, addScore } =
  dashboardSlice.actions;
export default dashboardSlice.reducer;
