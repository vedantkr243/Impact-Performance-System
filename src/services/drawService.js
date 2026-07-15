import { apiConnector } from "./apiConnector";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const unwrap = (response) => {
  const payload = response?.data ?? response ?? {};
  return payload?.data ?? payload;
};

export const drawService = {
  async getActiveDraw(token) {
    const response = await apiConnector({ method: "GET", url: "/api/v1/draws/active", token });
    return unwrap(response);
  },

  async getDraw(drawId, token) {
    const response = await apiConnector({ method: "GET", url: `/api/v1/draws/${drawId}`, token });
    return unwrap(response);
  },

  // Enter a specific draw by ID (subscription-gated on the server)
  async enterSpecificDraw(token, drawId) {
    const response = await apiConnector({ method: "POST", url: `/api/v1/draws/${drawId}/enter`, token, body: {} });
    return unwrap(response);
  },

  // Legacy — enter the featured/active draw
  async enterDraw(token, planCode) {
    const response = await apiConnector({
      method: "POST",
      url: `${BASE_URL}/api/v1/draws/enter`,
      token,
      body: planCode ? { planCode } : {}
    });
    return unwrap(response);
  },

  async getResults(drawId) {
    const response = await apiConnector({ method: "GET", url: `/api/v1/draws/${drawId}/results` });
    return unwrap(response);
  },

  // Admin: full draw details (entries + winner)
  async getDrawDetails(token, drawId) {
    const response = await apiConnector({ method: "GET", url: `/api/v1/draws/${drawId}/details`, token });
    return unwrap(response);
  },

  async startTestDraw() {
    const response = await apiConnector({ method: "POST", url: "/api/v1/draws/test/start" });
    return unwrap(response);
  },

  async createDraw(token, drawData) {
    const response = await apiConnector({ method: "POST", url: "/api/v1/draws", token, body: drawData });
    return unwrap(response);
  },

  async updateDraw(token, drawId, drawData) {
    const response = await apiConnector({ method: "PUT", url: `/api/v1/draws/${drawId}`, token, body: drawData });
    return unwrap(response);
  },

  async listAllDraws(token, { status, page = 1, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page);
    params.append("limit", limit);
    const response = await apiConnector({ method: "GET", url: `/api/v1/draws?${params.toString()}`, token });
    return unwrap(response);
  },

  async deleteDraw(token, drawId) {
    const response = await apiConnector({ method: "DELETE", url: `/api/v1/draws/${drawId}`, token });
    return unwrap(response);
  },

  async settleDraw(drawId) {
    const response = await apiConnector({ method: "POST", url: `/api/v1/draws/${drawId}/settle` });
    return unwrap(response);
  },

  // Auto-settle an expired draw (any authenticated user can trigger once countdown ends)
  async autoSettle(token, drawId) {
    const response = await apiConnector({ method: "POST", url: `/api/v1/draws/${drawId}/auto-settle`, token, body: {} });
    return unwrap(response);
  }
};
