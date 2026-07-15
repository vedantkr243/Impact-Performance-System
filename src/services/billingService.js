import {   apiConnector } from "./apiConnector";
const BASE_URL = import.meta.env.VITE_BASE_URL;
console.log(" billingService BASE_URL =", BASE_URL);
export const billingService = {
  async createCheckoutSession(token, planCode) {
    const response = await   apiConnector({
      method: "POST",
      url: `${BASE_URL}/api/v1/billing/checkout-session`,
      token,
      body: { plan: planCode }
    });

    return response.data;
  }
};
