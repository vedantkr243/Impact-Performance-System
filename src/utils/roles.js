import { ROUTES } from "../constants/config";

export const isAdmin = (user) => {
  const role = String(user?.role || user?.accountType || "user").toLowerCase();
  return role === "admin";
};

export const getDashboardPath = (user) =>
  isAdmin(user) ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD;

export const getRoleLabel = (user) => {
  if (isAdmin(user)) return "Admin";
  const accountType = user?.accountType;
  if (accountType) return accountType;
  return "User";
};
