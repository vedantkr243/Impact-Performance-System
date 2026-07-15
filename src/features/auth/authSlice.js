import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import axios from "axios";
const storedSession = authService.getStoredSession();

const initialState = {
  token: storedSession?.token || null,
  user: storedSession?.user || null,
  subscription: storedSession?.subscription || null,
  hasActiveSubscription: storedSession?.hasActiveSubscription || false,
  selectedPlan: storedSession?.selectedPlan || "yearly",
  loading: false,
  checkingSession: false,
  error: null
};
export const auth0LoginSuccess = createAsyncThunk(
  "auth/auth0Login",
  async (accessToken, { rejectWithValue }) => {
    try {
      console.log("Sending token:", accessToken);

      const response = await axios.post(
        "/api/v1/auth/auth0-login",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Backend response:", response.data);

      return response.data;
    } catch (err) {
      console.log("========== AUTH0 ERROR ==========");
      console.log(err);
      console.log(err.response);
      console.log(err.response?.data);
      console.log(err.response?.status);
      console.log("===============================");

      return rejectWithValue(err.response?.data);
    }
  }
);
export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return rejectWithValue(error.message || "Unable to login.");
  }
});

export const signupUser = createAsyncThunk("auth/signup", async (payload, { rejectWithValue }) => {
  try {
    return await authService.signup(payload);
  } catch (error) {
    return rejectWithValue(error.message || "Unable to create account.");
  }
});

export const refreshSession = createAsyncThunk(
  "auth/refreshSession",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return null;
      const user = await authService.getMe(token);
      const session = {
        token,
        user,
        subscription: user.subscription,
        hasActiveSubscription: user.hasActiveSubscription,
        selectedPlan: getState().auth.selectedPlan
      };
      localStorage.setItem("newPrdAuth", JSON.stringify(session));
      return session;
    } catch (error) {
      authService.clearSession();
      return rejectWithValue(error.message || "Session expired. Please login again.");
    }
  }
);

export const sendOtp = createAsyncThunk("auth/sendOtp", async (emailData, { rejectWithValue }) => {
  try {
    return await authService.sendOtp(emailData);
  } catch (error) {
    return rejectWithValue(error.message || "Unable to send OTP.");
  }
});

export const verifyOtp = createAsyncThunk("auth/verifyOtp", async (otpData, { rejectWithValue }) => {
  try {
    return await authService.verifyOtp(otpData);
  } catch (error) {
    return rejectWithValue(error.message || "Unable to verify OTP.");
  }
});

const setSession = (state, session) => {
  state.token = session.token;
  state.user = session.user;
  state.subscription = session.subscription;
  state.hasActiveSubscription = session.hasActiveSubscription;
  state.selectedPlan = session.selectedPlan || state.selectedPlan;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.subscription = null;
    state.hasActiveSubscription = false;
    state.selectedPlan = "yearly";
    state.error = null;
    authService.clearSession();
  },

  clearAuthError(state) {
    state.error = null;
  
},
  },
  extraReducers: (builder) => {
    
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        setSession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        setSession(state, action.payload);
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshSession.pending, (state) => {
        state.checkingSession = true;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.checkingSession = false;
        if (action.payload) {
          setSession(state, action.payload);
        }
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.checkingSession = false;
        state.token = null;
        state.user = null;
        state.subscription = null;
        state.hasActiveSubscription = false;
        state.selectedPlan = "yearly";
        state.error = action.payload;
      })
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(auth0LoginSuccess.fulfilled, (state, action) => {
  state.loading = false;
  state.error = null;
  setSession(state, action.payload);
});
  }
});
export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
