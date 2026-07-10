import { useEffect, useState } from "react";
import { dashboardService } from "../services/dashboardService";
import {
  CircleDollarSign,
  HandHeart,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { staticDataService } from "../services/staticDataService";
import { AdminDrawsManagement } from "../components/AdminDrawsManagement";

const STAT_ICONS = {
  "Total Users": Users,
  "Active Subscriptions": ShieldCheck,
  "Charity Pool": HandHeart,
  "Prize Pool": Wallet
};

function AdminDashboardPage() {
  const { user, token } = useAppSelector((state) => state.auth);
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const [stats, setStats] = useState([]);
  const [poolRules, setPoolRules] = useState([]);
  const [charityOverview, setCharityOverview] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingScores, setPendingScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getAdminContent(token);
        if (data.stats) setStats(data.stats);
        if (data.poolRules) setPoolRules(data.poolRules);
        if (data.charityOverview) setCharityOverview(data.charityOverview);
        if (data.recentActivity) setRecentActivity(data.recentActivity);

        const pending = await dashboardService.getPendingScores(token);
        if (pending?.success && pending.data) {
          setPendingScores(pending.data);
        }
      } catch (e) {
        console.warn("Failed to load admin dashboard data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleDecision = async (id, decision) => {
    if (!token) return;
    try {
      if (decision === "approve") {
        await dashboardService.approveScore(token, id);
      } else {
        await dashboardService.rejectScore(token, id);
      }
      const pending = await dashboardService.getPendingScores(token);
      setPendingScores(pending?.data || []);
    } catch (error) {
      console.warn("Failed to update pending score", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/90 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-slate-900 sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-slate-500">
            Welcome back, {firstName}. Monitor users, charity flow, and prize pool distribution.
          </p>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-8 lg:p-10">
        {loading ? <p className="text-sm text-slate-500">Loading admin data...</p> : null}

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = STAT_ICONS[stat.label] || Users;
            return (
              <article
                key={stat.label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                    <h3 className="mt-3 text-3xl font-bold">{stat.value}</h3>
                    <p className="mt-2 text-sm text-emerald-700">{stat.note}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                    <Icon className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:col-span-7">
            <div className="mb-6 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-700" />
              <h2 className="text-2xl font-bold">Charity process overview</h2>
            </div>
            <ol className="space-y-4 text-slate-600">
              {charityOverview.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-slate-50 p-4">
                  <strong className="text-[#111827]">
                    {index + 1}. {step.title}
                  </strong>
                  <p className="mt-1">{step.description}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:col-span-5">
            <div className="mb-6 flex items-center gap-3">
              <CircleDollarSign className="h-6 w-6 text-emerald-700" />
              <h2 className="text-2xl font-bold">Prize pool rules</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4">Match Type</th>
                    <th className="py-3 pr-4">Pool Share</th>
                    <th className="py-3">Rollover?</th>
                  </tr>
                </thead>
                <tbody>
                  {poolRules.map((row) => (
                    <tr key={row.matchType} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium">{row.matchType}</td>
                      <td className="py-3 pr-4 font-bold text-emerald-700">{row.share}</td>
                      <td className="py-3">{row.rollover}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Pending score submissions</h2>
              <p className="mt-1 text-sm text-slate-500">Review uploaded proofs before they affect the live score history.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {pendingScores.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No submissions currently waiting for review.</div>
            ) : pendingScores.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{item.user?.name || "Player"}</p>
                    <p className="text-sm text-slate-500">{item.score} points · {item.label || "Pending review"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleDecision(item._id, "approve")} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                    <button type="button" onClick={() => handleDecision(item._id, "reject")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Reject</button>
                  </div>
                </div>
                {item.image ? (
                  <img src={item.image} alt="Score proof" className="mt-4 h-48 w-full rounded-2xl object-cover" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <AdminDrawsManagement token={token} />
        </section>

        <section className="rounded-[28px] border border-[#99F6E4] bg-[#F0FDFA] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-emerald-700">Recent platform activity</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recentActivity.map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default AdminDashboardPage;
