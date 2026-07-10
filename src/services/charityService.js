import { apiConnector } from "./apiConnector";

export const charityService = {
  async signupCharity(payload) {
    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/charity/signup",
      body: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        contactNumber: payload.contactNumber || null,
        selectedPlan: payload.plan
      }
    });

    return response.data;
  },

  async getCharityDetails(charityId, token) {
    const response = await apiConnector({
      method: "GET",
      url: `/api/v1/charity/${charityId}`,
      token
    });

    return response.data;
  },

  async getCharityRevenue(charityId, token) {
    const response = await apiConnector({
      method: "GET",
      url: `/api/v1/charity/${charityId}/revenue`,
      token
    });

    return response.data;
  }
};
