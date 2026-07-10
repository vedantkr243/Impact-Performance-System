import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  CheckCircle,
  Download,
  Edit,
  Eye,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addScore } from "../features/dashboard/dashboardSlice";
import { dashboardService } from "../services/dashboardService";
import { staticDataService } from "../services/staticDataService";
import { withIcons } from "../utils/iconMap";

function MyPerformancePage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAppSelector((state) => state.auth);
  const [trendData, setTrendData] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingPerformance, setSubmittingPerformance] = useState(false);
  const [performanceForm, setPerformanceForm] = useState({
    score: "",
    activityType: "Golf Round",
    weather: "Sunny",
    notes: "",
    proofFile: null
  });
  useEffect(() => {
    if (searchParams.get("addPerformance") === "1") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const closeAddModal = () => {
    setShowAddModal(false);
    if (searchParams.has("addPerformance")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("addPerformance");
      setSearchParams(nextParams, { replace: true });
    }
  };


  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getPerformanceDefaults(token);
        const payload = data?.data || data || {};

        setTrendData(payload.trendData || []);
        setHistoryRows(payload.historyRows || []);
        setBreakdownData(payload.breakdownData || []);
        setRecommendations(payload.recommendations || []);
        setSummaryCards(withIcons(payload.summaryCards || []));
      } catch (e) {
        console.warn("Failed to load performance data:", e);
      }
    })();
  }, [token]);

  const scoreValues = useMemo(
    () => trendData.map((item) => Number(item.score) || 0).filter((value) => value > 0),
    [trendData]
  );

  const performanceMetrics = useMemo(() => {
    if (!scoreValues.length) {
      return {
        average: "—",
        best: "—",
        worst: "—",
        improvement: "—",
        entries: 0,
        latest: "—"
      };
    }

    const average = (scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length).toFixed(0);
    const best = Math.min(...scoreValues);
    const worst = Math.max(...scoreValues);
    const latest = scoreValues[0];
    const first = scoreValues[scoreValues.length - 1];
    const improvementValue = first != null && latest != null ? Math.abs(first - latest) : 0;
    const improvementLabel = latest != null && first != null && latest < first
      ? `+${improvementValue}`
      : latest != null && latest > first
        ? `-${improvementValue}`
        : "0";

    return {
      average,
      best,
      worst,
      improvement: `${improvementLabel} pts`,
      entries: scoreValues.length,
      latest
    };
  }, [scoreValues]);

  const performanceScore = useMemo(() => {
    if (!scoreValues.length) return { value: 0, label: "No score data yet" };

    const averageScore = Number(performanceMetrics.average);
    const derivedScore = Math.max(60, Math.min(99, Math.round(100 - Math.max(0, averageScore - 20) * 2)));

    return {
      value: derivedScore,
      label:
        derivedScore >= 90
          ? "Top 5% of players"
          : derivedScore >= 80
            ? "Top 10% of players"
            : "Keep building consistency"
    };
  }, [performanceMetrics.average, scoreValues.length]);

  const statsOverview = useMemo(
    () => [
      {
        label: "Best Round",
        value: performanceMetrics.best === "—" ? "—" : String(performanceMetrics.best),
        meta: performanceMetrics.best === "—" ? "No scores yet" : "Lowest score logged"
      },
      {
        label: "Worst Round",
        value: performanceMetrics.worst === "—" ? "—" : String(performanceMetrics.worst),
        meta: performanceMetrics.worst === "—" ? "No scores yet" : "Highest score logged"
      },
      {
        label: "Most Improved",
        value: performanceMetrics.improvement,
        meta: performanceMetrics.improvement === "—" ? "No scores yet" : "Latest vs first entry"
      },
      {
        label: "Entries",
        value: String(performanceMetrics.entries),
        meta: performanceMetrics.entries === 0 ? "No logs yet" : "Approved submissions"
      }
    ],
    [performanceMetrics]
  );

  const quickInsights = useMemo(
    () => [
      { label: "Best Round", value: performanceMetrics.best === "—" ? "—" : String(performanceMetrics.best) },
      { label: "Average", value: performanceMetrics.average },
      { label: "Improvement", value: performanceMetrics.improvement },
      { label: "Entries", value: String(performanceMetrics.entries) },
      { label: "Latest", value: performanceMetrics.latest === "—" ? "—" : String(performanceMetrics.latest) }
    ],
    [performanceMetrics]
  );

  const handleAddPerformance = async (event) => {
    event.preventDefault();
    const value = Number(performanceForm.score);
    if (Number.isNaN(value) || value <= 0 || value > 45) {
      alert("Please enter a valid score between 1 and 45");
      return;
    }

    const label = new Date().toLocaleString("en-US", { month: "short", day: "numeric" });
    const payload = {
      label,
      score: value,
      date: new Date().toISOString(),
      activityType: performanceForm.activityType,
      weather: performanceForm.weather,
      notes: performanceForm.notes,
      proofFile: performanceForm.proofFile
    };

    setSubmittingPerformance(true);

    try {
      if (token) {
        const result = await dashboardService.addScore(token, payload);
        if (result && result.success && result.score) {
          const saved = result.score;
          const historyEntry = {
            date: saved.label || label,
            score: Number(saved.score),
            type: saved.activityType || payload.activityType,
            weather: saved.weather || payload.weather,
            notes: saved.notes || payload.notes,
            trend: "Stable"
          };

          setHistoryRows((current) => [historyEntry, ...current]);
          setTrendData((current) => [
            ...current,
            { month: saved.label || label, score: Number(saved.score) }
          ]);
          setPerformanceForm({ score: "", activityType: "Golf Round", weather: "Sunny", notes: "", proofFile: null });
          closeAddModal();
          setSubmittingPerformance(false);
          return;
        }
      }

      dispatch(addScore(payload));
      setHistoryRows((current) => [{ ...payload, date: label, type: payload.activityType, weather: payload.weather, notes: payload.notes, trend: "Stable" }, ...current]);
      setTrendData((current) => [...current, { month: label, score: value }]);
      setPerformanceForm({ score: "", activityType: "Golf Round", weather: "Sunny", notes: "", proofFile: null });
      closeAddModal();
    } catch (e) {
      console.error("Failed to persist score, falling back to local state:", e);
      dispatch(addScore(payload));
      setHistoryRows((current) => [{ ...payload, date: label, type: payload.activityType, weather: payload.weather, notes: payload.notes, trend: "Stable" }, ...current]);
      setTrendData((current) => [...current, { month: label, score: value }]);
      setPerformanceForm({ score: "", activityType: "Golf Round", weather: "Sunny", notes: "", proofFile: null });
      closeAddModal();
    } finally {
      setSubmittingPerformance(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#111827]">My Performance</h1>
            <p className="mt-2 text-[#64748B]">
              Track every score and monitor your improvement.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 font-semibold text-white transition hover:bg-[#115E59]"
          >
            <Plus className="h-5 w-5" />
            Add Performance
          </button>
        </header>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#111827]">Add Performance</h2>
                  <p className="mt-1 text-sm text-slate-500">Capture your score plus the context around it.</p>
                </div>
                <button type="button" onClick={closeAddModal} className="text-sm font-semibold text-slate-500">Close</button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleAddPerformance}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Score</label>
                  <input
                    type="number"
                    min="1"
                    value={performanceForm.score}
                    onChange={(event) => setPerformanceForm((current) => ({ ...current, score: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Enter your score"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Activity Type</label>
                  <select
                    value={performanceForm.activityType}
                    onChange={(event) => setPerformanceForm((current) => ({ ...current, activityType: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option value="Golf Round">Golf Round</option>
                    <option value="Practice Round">Practice Round</option>
                    <option value="Training">Training</option>
                    <option value="Tournament">Tournament</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Weather</label>
                  <select
                    value={performanceForm.weather}
                    onChange={(event) => setPerformanceForm((current) => ({ ...current, weather: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Windy">Windy</option>
                    <option value="Rainy">Rainy</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
                  <textarea
                    rows="4"
                    value={performanceForm.notes}
                    onChange={(event) => setPerformanceForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Add notes about your round"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Scoreboard Proof Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPerformanceForm((current) => ({ ...current, proofFile: event.target.files?.[0] || null }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                  <p className="mt-1 text-xs text-slate-500">Upload a screenshot or photo of your scoreboard for admin review.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAddModal} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600">Cancel</button>
                  <button type="submit" disabled={submittingPerformance} className="rounded-xl bg-[#0F766E] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                    {submittingPerformance ? "Saving..." : "Save Performance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              value={card.value}
              subtext={card.subtext}
            />
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-12">
          <Card className="min-h-[400px] xl:col-span-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Performance Trend</h2>
                <p className="mt-1 text-sm text-slate-500">Lower score is better.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Last 30 Days", "Last 3 Months", "Last Year"].map((filter, index) => (
                  <button
                    key={filter}
                    className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                      index === 1
                        ? "border-[#0F766E] bg-emerald-50 text-[#0F766E]"
                        : "border-slate-200 text-slate-500 hover:border-[#0F766E]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} reversed />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 16,
                      boxShadow: "0 10px 30px rgba(15,118,110,0.08)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0F766E"
                    strokeWidth={4}
                    fill="url(#performanceFill)"
                    dot={{ r: 5, fill: "#0F766E", stroke: "#FFFFFF", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="xl:col-span-4">
            <h2 className="text-2xl font-bold">Statistics Overview</h2>
            <div className="mt-6 space-y-4">
              {statsOverview.map((item) => (
                <StatItem key={item.label} label={item.label} value={item.value} meta={item.meta} />
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <Card>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Performance History</h2>
                <p className="mt-1 text-sm text-slate-500">Trend compares each entry to the previous one: Improved, Declined, or Stable.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-slate-500">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Search</span>
                </div>
                <button className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">
                  Date Filter
                </button>
                <button className="flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    {["Date", "Score", "Activity Type", "Weather", "Notes", "Trend", "Actions"].map(
                      (header) => (
                        <th key={header} className="px-4 py-4 font-semibold">
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={`${row.date}-${row.score}`} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-4 font-medium">{row.date}</td>
                      <td className="px-4 py-4 font-bold text-[#0F766E]">{row.score}</td>
                      <td className="px-4 py-4 text-slate-600">{row.type}</td>
                      <td className="px-4 py-4 text-slate-600">{row.weather}</td>
                      <td className="px-4 py-4 text-slate-600">{row.notes}</td>
                      <td className="px-4 py-4">
                        <TrendBadge trend={row.trend} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <IconButton icon={Eye} label="View" />
                          <IconButton icon={Edit} label="Edit" />
                          <IconButton icon={Trash2} label="Delete" danger />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-6">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Performance Breakdown</h2>
                <div className="mt-6 space-y-4">
                  {breakdownData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="flex-1 text-sm font-medium text-slate-600">{item.name}</span>
                      <strong>{item.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105}>
                      {breakdownData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <article className="rounded-[28px] border border-[#99F6E4] bg-[#F0FDFA] p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] sm:p-8 xl:col-span-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                  AI Recommendations
                </p>
                <h2 className="mt-3 text-3xl font-bold">AI Performance Coach</h2>
              </div>
              <Sparkles className="h-8 w-8 text-[#0F766E]" />
            </div>

            <div className="mt-8 space-y-4">
              {recommendations.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
                  <span className="font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-5">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                  Performance Score
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <strong className="text-6xl font-bold">{performanceScore.value}</strong>
                  <span className="pb-2 text-xl font-semibold text-slate-400">/ 100</span>
                </div>
                <p className="mt-3 font-semibold text-slate-600">{performanceScore.label}</p>
              </div>
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-emerald-50">
                <div className="absolute inset-3 rounded-full border-[12px] border-emerald-100" />
                <div className="absolute inset-3 rounded-full border-[12px] border-[#0F766E] border-r-transparent" />
                <TrendingUp className="relative h-9 w-9 text-[#0F766E]" />
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {quickInsights.map((item) => (
                <QuickInsight key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </Card>
        </section>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <article
      className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] sm:p-8 ${className}`}
    >
      {children}
    </article>
  );
}

function SummaryCard({ icon: Icon, title, value, subtext }) {
  return (
    <Card className="p-6 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-3 text-4xl font-bold">{value}</h3>
          <p className="mt-2 text-sm text-emerald-600">{subtext}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
          <Icon className="h-6 w-6 text-[#0F766E]" />
        </div>
      </div>
    </Card>
  );
}

function StatItem({ label, value, meta }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-2 block text-xl">{value}</strong>
      <span className="mt-1 block text-sm text-slate-500">{meta}</span>
    </div>
  );
}

function TrendBadge({ trend }) {
  const styles = {
    Improved: "bg-emerald-50 text-emerald-700",
    Declined: "bg-red-50 text-red-600",
    Stable: "bg-slate-100 text-slate-600"
  };
  const prefix = trend === "Improved" ? "Up" : trend === "Declined" ? "Down" : "Flat";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[trend]}`} title={`Trend: ${trend}`}>
      {prefix} {trend}
    </span>
  );
}

function IconButton({ icon: Icon, label, danger = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-red-100 text-red-500 hover:bg-red-50"
          : "border-slate-200 text-slate-500 hover:border-[#0F766E] hover:text-[#0F766E]"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function QuickInsight({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4 text-center">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-2 block text-2xl text-[#0F766E]">{value}</strong>
    </div>
  );
}

export default MyPerformancePage;






