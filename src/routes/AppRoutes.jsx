import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "../components/auth/AdminRoute";
import OpenRoute from "../components/auth/OpenRoute";
import PrivateRoute from "../components/auth/PrivateRoute";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AuthScreen from "../pages/AuthScreen";
import CharitySystemPage from "../pages/CharitySystemPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import MyPerformancePage from "../pages/MyPerformancePage";
import DrawsPage from "../pages/DrawsPage";
import RewardsPage from "../pages/RewardsPage";
import AiInsightsPage from "../pages/AiInsightsPage";
import HomePage from "../pages/HomePage";
import PrizePoolPage from "../pages/PrizePoolPage";
import SignupEmailVerification from "../pages/SignupEmailVerification";
import SignupOTPVerification from "../pages/SignupOTPVerification";
import SignupPage from "../pages/SignupPage";
import SignupSubscription from "../pages/SignupSubscription";
import SubscriptionPage from "../pages/SubscriptionPage";
import { ROUTES } from "../constants/config";
import { isAdmin } from "../utils/roles";
import { useAppSelector } from "../app/hooks";

function UserDashboardLayout() {
  const { user } = useAppSelector((state) => state.auth);

  if (isAdmin(user)) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return <DashboardLayout variant="user" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/charity" element={<CharitySystemPage />} />
      <Route path="/prize-pool" element={<PrizePoolPage />} />

      <Route path="/signup" element={<OpenRoute><SignupEmailVerification /></OpenRoute>} />
      <Route path="/signup/verify-otp" element={<OpenRoute><SignupOTPVerification /></OpenRoute>} />
      <Route path="/signup/details" element={<OpenRoute><SignupPage /></OpenRoute>} />
      <Route path="/signup/subscription" element={<OpenRoute><SignupSubscription /></OpenRoute>} />
      <Route path="/login" element={<OpenRoute><AuthScreen mode="login" /></OpenRoute>} />
      <Route path="/signup-account" element={<OpenRoute><AuthScreen mode="signup" /></OpenRoute>} />

      <Route element={<PrivateRoute><UserDashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path="/dashboard/performance" element={<MyPerformancePage />} />
        <Route path="/dashboard/draws" element={<DrawsPage />} />
        <Route path="/dashboard/rewards" element={<RewardsPage />} />
        <Route path="/dashboard/ai-insights" element={<AiInsightsPage />} />
        <Route path="/dashboard/subscription" element={<SubscriptionPage />} />
      </Route>

      <Route element={<AdminRoute><DashboardLayout variant="admin" /></AdminRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminDashboardPage />} />
        <Route path="/admin/prize-pool" element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
