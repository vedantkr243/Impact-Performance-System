import {   apiConnector } from "./apiConnector";
const BASE_URL = import.meta.env.VITE_BASE_URL;
console.log(" charityService BASE_URL =", BASE_URL);
export const charityService = {
  async signupCharity(payload) {
    const response = await   apiConnector({
      method: "POST",
      url: `${BASE_URL}/api/v1/charity/signup`,
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
    const response = await   apiConnector({
      method: "GET",
      url: `${BASE_URL}/api/v1/charity/${charityId}`,
      token
    });

    return response.data;
  },

  async getCharityRevenue(charityId, token) {
    const response = await   apiConnector({
      method: "GET",
      url: `${BASE_URL}/api/v1/charity/${charityId}/revenue`,
      token
    });

    return response.data;
  }
};
