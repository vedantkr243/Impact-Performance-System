import { apiConnector } from "./apiConnector";

export const billingService = {
  async createCheckoutSession(token, planCode) {
    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/billing/checkout-session",
      token,
      body: { plan: planCode }
    });

    return response.data;
  }
};
