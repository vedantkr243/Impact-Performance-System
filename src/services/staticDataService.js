import { apiConnector } from "./apiConnector";

const unwrap = (response) => {
  const payload = response?.data ?? response ?? {};
  return payload?.data ?? payload;
};

const fetchStatic = async (url, token) => {
  try {
    return unwrap(await apiConnector({ method: "GET", url, token }));
  } catch {
    return {};
  }
};

export const staticDataService = {
  getHomeContent: () => fetchStatic("/api/v1/static/home"),

  getRewardsContent: (token) => fetchStatic("/api/v1/static/rewards", token),

  getPrizePoolRules: () => fetchStatic("/api/v1/static/prize-pool"),

  getCharityContent: () => fetchStatic("/api/v1/static/charity"),

  getPerformanceDefaults: (token) => fetchStatic("/api/v1/static/performance", token),

  getSignupPlans: () => fetchStatic("/api/v1/static/signup-plans"),

  getDashboardStatic: (token) => fetchStatic("/api/v1/data/dashboard", token),

  getAiInsights: (token) => fetchStatic("/api/v1/static/ai-insights", token),

  getDrawsContent: (token) => fetchStatic("/api/v1/static/draws", token),

  getSignupData: () => fetchStatic("/api/v1/static/signup"),

  getUiConstants: () => fetchStatic("/api/v1/static/ui"),

  getAdminContent: (token) => fetchStatic("/api/v1/static/admin", token)
};

