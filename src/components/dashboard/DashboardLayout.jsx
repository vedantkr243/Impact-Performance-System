import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { resetDashboard } from "../../features/dashboard/dashboardSlice";
import { ADMIN_NAV_ITEMS, USER_NAV_ITEMS } from "../../constants/dashboardNav";
import { getRoleLabel } from "../../utils/roles";
import { useAuth0 } from "@auth0/auth0-react";

function DashboardLayout({ variant = "user" }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { logout: auth0Logout, isAuthenticated } = useAuth0();

  const navItems = variant === "admin" ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;
  const roleLabel = getRoleLabel(user);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetDashboard());
    if (isAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[280px] flex-col bg-gradient-to-b from-[#0F766E] to-[#115E59] text-white lg:flex">
        <div className="px-8 py-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Fairway Impact" className="h-12 rounded-xl bg-white p-1.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                {variant === "admin" ? "ADMIN" : "FINL"}
              </p>
              <h2 className="text-xl font-bold">Fairway Impact</h2>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-white/70">{roleLabel} portal</p>
        </div>

        <nav className="flex-1 space-y-2 px-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/dashboard" || item.to === "/admin/dashboard"}
                className={({ isActive }) =>
                  `flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-medium transition hover:bg-white/10 ${
                    isActive ? "bg-white/10 shadow-sm backdrop-blur-md text-white" : "text-white/78"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 pb-8">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-white/85 transition hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="lg:ml-[280px]">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
