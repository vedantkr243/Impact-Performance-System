import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchFrontpageData = createAsyncThunk(
  'content/fetchFrontpage',
  async (_, { rejectWithValue }) => {
    try {
      const [footerRes, stepsRes, featuresRes, impactRes] = await Promise.all([
        axios.get(' api/v1/content/footer'),
        axios.get(' api/v1/content/how-it-works'),
        axios.get(' api/v1/content/features'),
        axios.get(' api/v1/content/impact')
      ]);

      return {
        footer: footerRes.data,
        howItWorks: stepsRes.data,
        features: featuresRes.data,
        impact: impactRes.data
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load frontpage data.");
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    footerData: null,
    howItWorksSteps: null,
    featuresData: null,
    impactStats: null,
    loading: true,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontpageData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFrontpageData.fulfilled, (state, action) => {
        state.loading = false;
        state.footerData = action.payload.footer;
        state.howItWorksSteps = action.payload.howItWorks;
        state.featuresData = action.payload.features;
        state.impactStats = action.payload.impact;
      })
      .addCase(fetchFrontpageData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export default contentSlice.reducer;