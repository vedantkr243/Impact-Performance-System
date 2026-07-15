import { apiConnector } from "./apiConnector";
const BASE_URL = import.meta.env.VITE_BASE_URL;
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
  getHomeContent: () => fetchStatic(`${BASE_URL}/api/v1/static/home`),

  getRewardsContent: (token) => fetchStatic(`${BASE_URL}/api/v1/static/rewards`, token),

  getPrizePoolRules: () => fetchStatic(`${BASE_URL}/api/v1/static/prize-pool`),

  getCharityContent: () => fetchStatic(`${BASE_URL}/api/v1/static/charity`),

  getPerformanceDefaults: (token) => fetchStatic(`${BASE_URL}/api/v1/static/performance`, token),

  getSignupPlans: () => fetchStatic(`${BASE_URL}/api/v1/static/signup-plans`),

  getDashboardStatic: (token) => fetchStatic(`${BASE_URL}/api/v1/data/dashboard`, token),

  getAiInsights: (token) => fetchStatic(`${BASE_URL}/api/v1/static/ai-insights`, token),

  getDrawsContent: (token) => fetchStatic(`${BASE_URL}/api/v1/static/draws`, token),

  getSignupData: () => fetchStatic(`${BASE_URL}/api/v1/static/signup`),

  getUiConstants: () => fetchStatic(`${BASE_URL}/api/v1/static/ui`),

  getAdminContent: (token) => fetchStatic(`${BASE_URL}/api/v1/static/admin`, token)
};

