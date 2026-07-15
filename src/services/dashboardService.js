import {   apiconnector } from "./apiconnector";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const normalizeScores = (scores) =>
  scores.map((item) => ({
    score: item.score,
    date: item.date
  }));

export const dashboardService = {
  async getCurrentUser(token) {
    const response = await   apiconnector({
      method: "GET",
      url: `${BASE_URL} api/v1/auth/me`,
      token
    });

    return response.data;
  },

  async getBillingPlans() {
    const response = await   apiconnector({
      method: "GET",
      url: `${BASE_URL} api/v1/billing/plans`
    });

    return response.data;
  },

  async getSubscription(token) {
    const response = await   apiconnector({
      method: "GET",
      url: `${BASE_URL} api/v1/billing/subscription`,
      token
    });

    return response.data;
  },

  async getScoreAnalysis(token, scores) {
    const response = await   apiconnector({
      method: "POST",
      url: `${BASE_URL} api/v1/score-analytics/analyze`,
      token,
      body: {
        scores: normalizeScores(scores)
      }
    });

    return response.data;
  },

  async addScore(token, { score, label, date, proofFile }) {
    const formData = new FormData();
    formData.append("score", score);
    if (label) formData.append("label", label);
    if (date) formData.append("date", date);
    if (proofFile) formData.append("proof", proofFile);

    const response = await   apiconnector({
      method: "POST",
      url: `${BASE_URL} api/v1/scores`,
      token,
      body: formData
    });

    return response.data;
  },

  async getAssistantReply(token, { question, scores, charity, subscription }) {
    const response = await   apiconnector({
      method: "POST",
      url: `${BASE_URL} api/v1/assistant/ask`,
      token,
      body: {
        question,
        context: {
          scores: normalizeScores(scores),
          charity: charity ? { name: charity.name } : null,
          subscription: {
            status: subscription?.status || "Not Started",
            monthlyContribution: subscription?.charityRevenueShare || 0
          },
          winnings: [
            { title: "April Draw", value: "$500 gear credit" },
            { title: "Consistency Bonus", value: "3 bonus entries" }
          ]
        }
      }
    });

    return response.data;
  },

  // Profile Management
  async updateProfile(token, { name, contactNumber }) {
    return await   apiconnector({
      method: "PUT",
      url: `${BASE_URL} api/v1/auth/profile`,
      token,
      body: { name, contactNumber }
    });
  },

  async uploadProfilePhoto(token, file) {
    const formData = new FormData();
    formData.append("photo", file);
    return await   apiconnector({
      method: "PUT",
      url: `${BASE_URL} api/v1/auth/profile/photo`,
      token,
      body: formData
    });
  },

  async changePassword(token, { currentPassword, newPassword, confirmPassword }) {
    return await   apiconnector({
      method: "PUT",
      url: `${BASE_URL} api/v1/auth/profile/password`,
      token,
      body: { currentPassword, newPassword, confirmPassword }
    });
  },

  // Score Verification (Admin)
  async getPendingScores(token) {
    return await   apiconnector({
      method: "GET",
      url: `${BASE_URL} api/v1/scores/pending`,
      token
    });
  },

  async approveScore(token, scoreId) {
    return await   apiconnector({
      method: "PUT",
      url: `${BASE_URL} api/v1/scores/${scoreId}/approve`,
      token
    });
  },

  async rejectScore(token, scoreId) {
    return await   apiconnector({
      method: "PUT",
      url: `${BASE_URL} api/v1/scores/${scoreId}/reject`,
      token
    });
  }
};
