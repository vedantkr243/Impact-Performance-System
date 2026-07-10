import { apiConnector } from "./apiConnector";

const AUTH_STORAGE_KEY = "newPrdAuth";

const saveSession = (session) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const authService = {
  getStoredSession() {
    try {
      const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
      return rawSession ? JSON.parse(rawSession) : null;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  async login(credentials) {
    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/auth/login",
      body: credentials
    });

    saveSession(response.data);
    return response.data;
  },

  async sendOtp({ email }) {
    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/auth/send-otp",
      body: { email }
    });

    return response.data;
  },

  async verifyOtp({ email, otp }) {
    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/auth/verify-otp",
      body: { email, otp }
    });

    return response.data;
  },

  async signup(payload) {
    const name =
      payload.name?.trim() ||
      [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim();

    const response = await apiConnector({
      method: "POST",
      url: "/api/v1/auth/signup",
      body: {
        name,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword || payload.password,
        role: payload.accountType,
        accountType: payload.accountType,
        contactNumber: payload.contactNumber || null,
        selectedCharityName: payload.selectedCharityName || null
      }
    });

    const session = {
      ...response.data,
      selectedPlan: payload.plan
    };

    saveSession(session);
    return session;
  },

  async getMe(token) {
    const response = await apiConnector({
      method: "GET",
      url: "/api/v1/auth/me",
      token
    });

    return response.data;
  }
};
