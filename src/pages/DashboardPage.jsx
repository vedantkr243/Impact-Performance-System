import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Bell,
  Brain,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Flame,
  Gift,
  HandHeart,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  Zap
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useDrawCountdown } from "../hooks/useDrawCountdown";
import { refreshSession } from "../features/auth/authSlice";
import { bootstrapDashboard } from "../features/dashboard/dashboardSlice";
import { staticDataService } from "../services/staticDataService";
import { drawService } from "../services/drawService";
import { CountdownDisplay } from "../components/CountdownDisplay";
import { ROUTES } from "../constants/config";

const FALLBACK_DRAW_SCHEDULE = [
  {
    title: "Mega Summer Draw 2026",
    prize: "$50,000",
    endsAt: "2026-07-30T23:59:59.000Z"
  },
  {
    title: "Mega Autumn Draw 2026",
    prize: "$50,000",
    endsAt: "2026-10-30T23:59:59.000Z"
  },
  {
    title: "Mega Winter Draw 2026",
    prize: "$50,000",
    endsAt: "2026-12-30T23:59:59.000Z"
  }
];

function getCountdownParts(targetDate) {
  const difference = new Date(targetDate).getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const {
    profile,
    loading,
    error,
    scoreHistory,
    kpis,
    aiCoachInsights,
    revenueSplit,
    charityImpactTotal,
    nextDraw,
    walletBalance,
    platformShare
  } = useAppSelector((state) => state.dashboard);
  const [fallbackScoresState, setFallbackScoresState] = useState([]);
  const [recentScoresState, setRecentScoresState] = useState([]);
  const [transactionsState, setTransactionsState] = useState([]);
  const [activitiesState, setActivitiesState] = useState([]);
  const [activeDraw, setActiveDraw] = useState(FALLBACK_DRAW_SCHEDULE[0]);
  const [dashboardKpis, setDashboardKpis] = useState(null);
  const [drawEnded, setDrawEnded] = useState(false);
  const [backendDraws, setBackendDraws] = useState([]);
  const [recentWinnings, setRecentWinnings] = useState([]);

  const timeLeft = useDrawCountdown(activeDraw?.endsAt);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getDashboardStatic(auth.token);
        const payload = data?.data || data || {};

        setFallbackScoresState(payload.fallbackScores || payload.baseScoreHistory || []);
        setRecentScoresState(payload.recentScores || []);
        setTransactionsState(payload.transactions || payload.transaction || []);
        setActivitiesState(payload.activities || []);
        setDashboardKpis(payload.kpis || null);

        // Fetch backend draws to check for winnings & active draws
        try {
          const drawsData = await drawService.listAllDraws(auth.token, { limit: 100 });
          let draws = drawsData?.draws || (Array.isArray(drawsData) ? drawsData : []);

          // Auto-settle: open expired draws + completed draws never paid out
          const expiredUnsettled = draws.filter((d) => {
            if (!d.hasEntered) return false;
            const deadline = d.drawDate || d.endsAt;
            const deadlinePassed = deadline && new Date(deadline) <= new Date();
            if (d.status === "open" && deadlinePassed) return true;
            if (d.status === "completed" && (d.myEntry?.prizeAmount ?? 0) === 0) return true;
            return false;
          });
          if (expiredUnsettled.length > 0) {
            await Promise.allSettled(
              expiredUnsettled.map((d) => drawService.autoSettle(auth.token, d._id))
            );
            const refreshed = await drawService.listAllDraws(auth.token, { limit: 100 });
            draws = refreshed?.draws || draws;
          }

          setBackendDraws(draws.filter((d) => d.status === "open"));

          const won = draws.filter((d) => d.myEntry?.prizeAmount > 0);
          setRecentWinnings(won);

          // Fire winning toast once per draw (clear stale keys for unpaid draws)
          draws.forEach((d) => {
            const prize = d.myEntry?.prizeAmount ?? 0;
            const key = `win_notified_${d._id}`;
            if (prize === 0) { localStorage.removeItem(key); return; }
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, "1");
              const tier = d.myEntry?.tier || "";
              const matched = d.myEntry?.matchCount || 0;
              toast.success(
                `🏆 You Won $${Number(prize).toFixed(2)} in "${d.title}"!\n${tier ? `${tier} — ${matched} numbers matched` : ""}`,
                {
                  position: "top-center",
                  autoClose: 10000,
                  closeOnClick: false,
                  toastId: `win-${d._id}`,
                  style: {
                    background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
                    color: "#fff",
                    fontWeight: "600",
                    borderRadius: "16px",
                    fontSize: "15px",
                    boxShadow: "0 20px 50px rgba(15,118,110,0.35)"
                  }
                }
              );
            }
          });
        } catch (e) {
          console.warn("Failed to load backend draws:", e);
        }
      } catch (e) {
        console.warn("Failed to load dashboard static UI data:", e);
      }
    })();
  }, [auth.token, kpis]);

  useEffect(() => {
    if (auth.token) {
      dispatch(refreshSession());
      dispatch(bootstrapDashboard());
    }
  }, [auth.token, dispatch]);

  const firstName = profile?.firstName || auth.user?.firstName || auth.user?.name?.split(" ")[0] || "Player";

  const chartData = useMemo(() => {
    const source = scoreHistory?.length ? scoreHistory : fallbackScoresState;
    return source.map((item, index) => ({
      label: item.label || item.date || `Round ${index + 1}`,
      score: Number(item.score) || 0
    }));
  }, [scoreHistory, fallbackScoresState]);

  const recentScores = useMemo(() => {
    const source = scoreHistory?.length
      ? [...scoreHistory]
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          .slice(0, 5)
          .map((item) => ({
            date: item.label || (item.date ? new Date(item.date).toLocaleDateString() : "Recent"),
            score: Number(item.score) || 0
          }))
      : recentScoresState;

    return source.slice(0, 5);
  }, [scoreHistory, recentScoresState]);

  useEffect(() => {
    const drawFromStore = nextDraw?.title
      ? {
          title: nextDraw.title,
          prize: nextDraw.prize || "$50,000",
          endsAt: nextDraw.endsAt || nextDraw.deadline || null
        }
      : null;

    const initialDraw = drawFromStore && drawFromStore.endsAt
      ? drawFromStore
      : FALLBACK_DRAW_SCHEDULE.find((item) => new Date(item.endsAt) > new Date()) || FALLBACK_DRAW_SCHEDULE[0];

    setActiveDraw(initialDraw);
  }, [nextDraw]);

  // Handle draw expiration and show toast
  useEffect(() => {
    if (timeLeft.isExpired && !drawEnded) {
      setDrawEnded(true);
      
      // Show toast notification
      toast.info("🎉 Dashboard Draw has ended! Moving to next draw...", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Move to next draw
      setActiveDraw((current) => {
        const currentIndex = FALLBACK_DRAW_SCHEDULE.findIndex((item) => item.title === current?.title);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % FALLBACK_DRAW_SCHEDULE.length;
        setDrawEnded(false);
        return FALLBACK_DRAW_SCHEDULE[nextIndex];
      });
    }
  }, [timeLeft.isExpired, drawEnded]);

  const visibleKpis = kpis || dashboardKpis;

  const drawCountdown = [
    [timeLeft.days, "Days"],
    [timeLeft.hours, "Hours"],
    [timeLeft.minutes, "Min"],
    [timeLeft.seconds, "Sec"]
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-[#F8FAFC]/90 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-[#111827] sm:text-4xl">
                Hello , {firstName}👋
              </h1>
              <p className="mt-2 text-slate-500">Here&apos;s your latest impact summary.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                <Bell className="h-5 w-5" />
              </button>
              <button className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-3 pr-4 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] text-sm font-bold text-white">
                  {firstName.charAt(0)}
                </span>
                <span className="text-sm font-semibold">{firstName}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`${ROUTES.PERFORMANCE}?addPerformance=1`)}
                className="flex h-12 items-center gap-2 rounded-xl bg-[#0F766E] px-5 font-semibold text-white transition hover:bg-[#115E59]"
              >
                <Plus className="h-5 w-5" />
                Add Performance
              </button>
            </div>
          </div>
      </header>


      <div className="space-y-6 p-5 sm:p-8 lg:p-10">
          {loading ? <p className="text-sm font-medium text-slate-500">Syncing dashboard...</p> : null}
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          {/* Celebration / Winning Notifications */}
          {recentWinnings.map((draw) => (
            <div key={draw._id} className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 p-6 text-white shadow-xl animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6 border border-teal-400">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Congratulations! You Won! 🎉</h3>
                  <p className="text-emerald-50 text-sm mt-1">
                    You matched {draw.myEntry.matchCount} numbers in <strong>{draw.title}</strong> and won a prize of <strong>${draw.myEntry.prizeAmount}</strong>!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 relative z-10 w-full md:w-auto shrink-0">
                <button 
                  onClick={() => navigate("/dashboard/draws")}
                  className="w-full md:w-auto h-11 px-5 rounded-xl bg-white text-[#0F766E] font-bold text-sm hover:bg-emerald-50 transition-colors shadow-md"
                >
                  View Winnings
                </button>
              </div>
            </div>
          ))}

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard icon={Zap} label="Impact Score" value={visibleKpis?.impactScore ?? "—"} />
            <KpiCard icon={Flame} label="Playing Streak" value={visibleKpis?.streak ?? "—"} highlight={visibleKpis?.streak && visibleKpis.streak !== "—"} />
            <KpiCard icon={CircleDollarSign} label="Rewards Won" value={visibleKpis?.rewardsWon ?? "—"} />
            <KpiCard icon={CalendarDays} label="Active Draws" value={visibleKpis?.activeDraws ?? "—"} />
            <KpiCard icon={HandHeart} label="Charity Impact" value={visibleKpis?.charityImpact ?? "—"} />
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <DashboardCard className="min-h-[420px] xl:col-span-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Performance Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">Score trend across recent rounds.</p>
                </div>
                <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">
                  This Month
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 10px 30px rgba(15,118,110,0.08)"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#0F766E"
                      strokeWidth={4}
                      fill="url(#scoreFill)"
                      dot={{ r: 5, fill: "#0F766E", strokeWidth: 3, stroke: "#FFFFFF" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>

            <DashboardCard className="xl:col-span-4">
              <h2 className="text-2xl font-bold">Recent Scores</h2>
              <div className="mt-6 space-y-4">
                {recentScores.map((item, index) => (
                  <div
                    key={`${item.date}-${item.score}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-600">{item.date}</span>
                    <strong className="text-lg text-[#0F766E]">{item.score}</strong>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            {/* <article className="rounded-[28px] border border-[#0F766E]/10 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] p-8 text-white shadow-[0_10px_30px_rgba(15,118,110,0.18)] xl:col-span-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Next Draw</p>
              <h2 className="mt-4 text-3xl font-bold">{activeDraw?.title ?? nextDraw?.title ?? "Upcoming draw"}</h2>
              <p className="mt-3 text-sm text-white/80">Prize pool: {activeDraw?.prize ?? nextDraw?.prize ?? "$50,000"}</p>
              <div className="mt-8 grid grid-cols-4 gap-3">
                {drawCountdown.map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur-md">
                    <strong className="block text-2xl">{value}</strong>
                    <span className="text-xs text-white/75">{label}</span>
                  </div>
                ))}
              </div>
              <button className="mt-8 h-12 rounded-xl bg-white px-6 font-semibold text-[#0F766E]">
                View Draw
              </button>
            </article> */}

            <DashboardCard className="xl:col-span-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Rewards Wallet</p>
                  <h2 className="mt-3 text-4xl font-bold">{walletBalance ?? "—"}</h2>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                  <Wallet className="h-8 w-8 text-[#0F766E]" />
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {transactionsState.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <strong className={item.tone}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </DashboardCard>

            {backendDraws.length > 0 && (
              <DashboardCard className="xl:col-span-4">
                <h2 className="text-2xl font-bold">Active Draws</h2>
                <div className="mt-6 space-y-4">
                  {backendDraws.slice(0, 2).map((draw) => (
                    <div key={draw._id} className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                      <h3 className="font-semibold text-slate-900 text-sm">{draw.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">Prize: {draw.prize}</p>
                      
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">Countdown:</p>
                        <CountdownDisplay targetDate={draw.drawDate} className="gap-1" />
                      </div>

                      <button className="mt-3 w-full h-9 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition">
                        Join Draw
                      </button>
                    </div>
                  ))}
                  {backendDraws.length > 2 && (
                    <button 
                      onClick={() => navigate(ROUTES.DRAWS)}
                      className="w-full h-9 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition"
                    >
                      View All Draws
                    </button>
                  )}
                </div>
              </DashboardCard>
            )}

            <DashboardCard className="xl:col-span-4">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <div className="mt-6 space-y-3">
                {activitiesState.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                      <Target className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-500">No activity yet</p>
                    <p className="text-sm text-slate-400">Log your first score to start your activity feed.</p>
                  </div>
                ) : (
                  activitiesState.map((activity, index) => (
                    <ActivityItem key={`${activity.label}-${index}`} activity={activity} />
                  ))
                )}
              </div>
            </DashboardCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <DashboardCard className="xl:col-span-6">
              <div className="grid gap-8 md:grid-cols-[1fr_180px] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                    Charity Impact
                  </p>
                  <h2 className="mt-4 text-5xl font-bold">{charityImpactTotal ?? "—"}</h2>
                  <p className="mt-2 text-slate-500">Total Impact Created</p>

                  <div className="mt-8 space-y-4">
                    {revenueSplit.map((item) => (
                      <Breakdown key={item.label} label={item.label} value={item.value} width={item.width} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-emerald-50">
                    <div className="absolute inset-4 rounded-full border-[14px] border-emerald-100" />
                    <div className="absolute inset-4 rounded-full border-[14px] border-[#0F766E] border-r-transparent border-t-transparent" />
                    <strong className="relative text-3xl text-[#0F766E]">{platformShare ?? "—"}</strong>
                  </div>
                  <div className="flex items-end gap-2 text-[#0F766E]">
                    <HandHeart className="h-10 w-10" />
                    <Sparkles className="h-7 w-7" />
                    <Zap className="h-9 w-9" />
                  </div>
                </div>
              </div>
            </DashboardCard>

            <article className="rounded-[28px] border border-[#99F6E4] bg-[#F0FDFA] p-8 shadow-[0_10px_30px_rgba(15,118,110,0.06)] xl:col-span-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                    AI Coach Insights
                  </p>
                  <h2 className="mt-4 text-3xl font-bold">AI Performance Coach</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0F766E]">
                  <Brain className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {aiCoachInsights.map((insight) => (
                  <div key={insight} className="rounded-2xl bg-white p-4 font-semibold text-slate-700">
                    <span className="mr-2 text-[#0F766E]">✓</span>
                    {insight}
                  </div>
                ))}
              </div>

              <button className="mt-8 h-12 rounded-xl bg-[#0F766E] px-6 font-semibold text-white transition hover:bg-[#115E59]">
                View Full Analysis
              </button>
            </article>
          </section>
        </div>
    </>
  );
}

function DashboardCard({ children, className = "" }) {
  return (
    <article
      className={`rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] sm:p-8 ${className}`}
    >
      {children}
    </article>
  );
}

function KpiCard({ icon: Icon, label, value, highlight = false }) {
  return (
    <DashboardCard className="p-6 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h3
            className={`mt-3 text-3xl font-bold ${
              highlight ? "text-orange-500" : "text-[#111827]"
            }`}
          >
            {value}
          </h3>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            highlight ? "bg-orange-100" : "bg-emerald-100"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              highlight ? "text-orange-500" : "text-[#0F766E]"
            }`}
          />
        </div>
      </div>
    </DashboardCard>
  );
}

function Breakdown({ label, value, width }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className="text-[#0F766E]">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#0F766E]" style={{ width }} />
      </div>
    </div>
  );
}

/** Map activity type → { icon component, bg colour, icon colour, border colour } */
const ACTIVITY_META = {
  score:        { Icon: Zap,    bg: "bg-emerald-50",  iconColor: "text-[#0F766E]",  border: "border-[#0F766E]" },
  win:          { Icon: Trophy, bg: "bg-amber-50",    iconColor: "text-amber-500",   border: "border-amber-400" },
  charity:      { Icon: HandHeart, bg: "bg-pink-50",  iconColor: "text-pink-500",   border: "border-pink-400" },
  reward:       { Icon: Gift,   bg: "bg-violet-50",   iconColor: "text-violet-500", border: "border-violet-400" },
  subscription: { Icon: Flame,  bg: "bg-orange-50",   iconColor: "text-orange-500", border: "border-orange-400" },
  system:       { Icon: Zap,    bg: "bg-slate-50",    iconColor: "text-slate-400",  border: "border-slate-300" },
};

function ActivityItem({ activity }) {
  const meta = ACTIVITY_META[activity.type] || ACTIVITY_META.system;
  const { Icon, bg, iconColor, border } = meta;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border-l-4 ${border} bg-white px-4 py-3 shadow-sm`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-700">{activity.label}</p>
        <span className="text-xs text-slate-400">{activity.time || activity.timeLabel}</span>
      </div>
    </div>
  );
}

export default DashboardPage;



