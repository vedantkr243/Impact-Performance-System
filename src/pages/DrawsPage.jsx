import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer,
  Tooltip, PieChart, Pie, Cell, XAxis
} from "recharts";
import {
  Gift, Ticket, Trophy, Target, Users, Wallet,
  X, Crown, Lock, CheckCircle, AlertCircle, ChevronRight,
  CreditCard, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../services/apiConnector";
import { useAppSelector } from "../app/hooks";
import { useDrawCountdown } from "../hooks/useDrawCountdown";
import { staticDataService } from "../services/staticDataService";
import { drawService } from "../services/drawService";
import { resolveIcon } from "../utils/iconMap";
import { CountdownDisplay } from "../components/CountdownDisplay";

// ─── constants ────────────────────────────────────────────────────────────────
const STAT_ICON_FALLBACKS = {
  "Active Draws": Gift, "Total Entries": Ticket, "Total Winnings": Trophy,
  "Winning Rate": Target, "Total Participants": Users, "Draw Pool Value": Wallet, "Your Entries": Ticket
};

const FALLBACK_DRAW = {
  name: "Mega Draw 2026", prize: "$50,000", entries: 0,
  endsAt: "2026-07-30T23:59:59.000Z"
};

const PLAN_LABELS = { any: "Any Subscription", monthly: "Monthly Plan", yearly: "Yearly Plan" };
const PLAN_COLORS = {
  any: "bg-emerald-100 text-emerald-700",
  monthly: "bg-blue-100 text-blue-700",
  yearly: "bg-purple-100 text-purple-700"
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function toNumber(value) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ─── Subscription Gate Modal ──────────────────────────────────────────────────
function SubscriptionGateModal({ draw, onClose }) {
  const navigate = useNavigate(); // eslint-disable-line
  const required = draw?.requiredPlan || "any";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Subscription Required</h3>
          <p className="mt-3 text-slate-500 leading-relaxed">
            To enter <strong className="text-slate-800">{draw?.title}</strong>, you need an active{" "}
            <strong className="text-[#0F766E]">{PLAN_LABELS[required]}</strong>.
          </p>
          {required === "yearly" && (
            <div className="mt-4 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-700">
              <Crown className="inline w-4 h-4 mr-1" /> This is an exclusive draw for Yearly subscribers only.
            </div>
          )}
          <button
            onClick={() => { onClose(); navigate("/dashboard/subscription"); }}
            className="mt-6 w-full h-12 rounded-xl bg-[#0F766E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0D6460] transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Subscribe Now
          </button>
          <button onClick={onClose} className="mt-3 text-sm text-slate-400 hover:text-slate-600">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Draw Details Modal ──────────────────────────────────────────────────
function DrawDetailsModal({ drawId, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await drawService.getDrawDetails(token, drawId);
        setData(result);
      } catch (e) {
        console.warn("Failed to load draw details:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [drawId, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-[28px] bg-white shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Draw Details</h2>
            {data?.draw && <p className="text-slate-500 mt-1">{data.draw.title}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading draw details…</div>
          ) : !data ? (
            <div className="py-16 text-center text-slate-400">Could not load details.</div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-[#F0FDFA] p-4 text-center">
                  <div className="text-sm text-slate-500">Prize Pool</div>
                  <div className="text-xl font-bold text-[#0F766E] mt-1">{data.draw?.prize || "--"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500">Total Participants</div>
                  <div className="text-xl font-bold mt-1">{data.totalParticipants}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500">Draw Date</div>
                  <div className="text-xl font-bold mt-1">{formatDate(data.draw?.drawDate)}</div>
                </div>
              </div>

              {/* Winner */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Winner
                </h3>
                {data.winner ? (
                  <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-white text-xl font-bold">
                        {data.winner.name?.charAt(0) || "W"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{data.winner.name}</p>
                        <p className="text-sm text-slate-500">{data.winner.email}</p>
                        <p className="text-sm text-amber-700 font-medium mt-1">Prize: {data.winner.prize || "--"}</p>
                      </div>
                    </div>
                    {data.winner.numbers?.length > 0 && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        {data.winner.numbers.map((n) => (
                          <span key={n} className="w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-sm">{n}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-slate-500 text-sm">No winner recorded yet.</div>
                )}
              </div>

              {/* All entries table */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#0F766E]" /> All Entries ({data.entries?.length || 0})
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Entry Code</th>
                        <th className="px-4 py-3 font-medium">Numbers</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Prize</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data.entries || []).map((entry) => (
                        <tr key={entry._id} className={entry.prizeAmount > 0 ? "bg-amber-50" : ""}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{entry.user?.name || "Unknown"}</div>
                            <div className="text-xs text-slate-400">{entry.user?.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{entry.entryCode}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {(entry.numbers || []).map((n) => (
                                <span key={n} className="w-7 h-7 rounded-full bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center text-xs font-bold">{n}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">{entry.planCode || "--"}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">
                            {entry.prizeAmount > 0 ? `$${entry.prizeAmount}` : "--"}
                          </td>
                        </tr>
                      ))}
                      {!data.entries?.length && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No entries found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Draw Card (user) ─────────────────────────────────────────────────────────
function ActiveDrawCard({ draw, userSubscription, onEnter, entering, hasEntered }) {
  const timeLeft = useDrawCountdown(draw.drawDate);
  const required = draw.requiredPlan || "any";
  const hasActiveSlot = userSubscription && userSubscription.isActive !== false;
 
  const canEnter = hasActiveSlot &&
    (required === "any" ||
     required === "monthly" && ["monthly", "yearly"].includes(userSubscription.planCode) ||
     required === "yearly" && userSubscription.planCode === "yearly");

  const needsUpgrade = hasActiveSlot && !canEnter;
  const needsSub = !userSubscription || userSubscription.isActive === false;
  const scoreHistory = useAppSelector(
  (state) => state.dashboard.scoreHistory
);
  const auth = useAppSelector((state) => state.auth);
const [recentScoresState, setRecentScoresState] = useState([]);

useEffect(() => {
  (async () => {
    try {
      const data = await staticDataService.getDashboardStatic(auth.token);
      const payload = data?.data || data || {};

      setRecentScoresState(payload.recentScores || []);
    } catch (err) {
      console.error(err);
    }
  })();
}, [auth.token]);

const recentScores = useMemo(() => {
  const source = scoreHistory?.length
    ? [...scoreHistory]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5)
        .map((item) => ({
          date:
            item.label ||
            (item.date
              ? new Date(item.date).toLocaleDateString()
              : "Recent"),
          score: Number(item.score) || 0,
        }))
    : recentScoresState;

  return source.slice(0, 5);
}, [scoreHistory, recentScoresState]);
  return (
    <div className={`rounded-[24px] border p-6 flex flex-col gap-4 transition-shadow hover:shadow-md ${hasEntered ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-lg leading-snug">{draw.title}</h4>
          <p className="text-sm text-slate-500 mt-1">{formatDate(draw.drawDate)}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PLAN_COLORS[required]}`}>
          {required === "any" ? "All Plans" : PLAN_LABELS[required]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500 text-xs">Prize Pool</div>
          <div className="font-bold text-[#0F766E] mt-0.5">{draw.prize}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500 text-xs">Participants</div>
          <div className="font-bold mt-0.5">{draw.participantCount ?? draw.analytics?.participants ?? 0}</div>
        </div>
      </div>

      {/* Countdown */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Time Remaining</p>
        <div className="flex gap-2">
          {[["Days", timeLeft.days], ["Hrs", timeLeft.hours], ["Min", timeLeft.minutes], ["Sec", timeLeft.seconds]].map(([label, val]) => (
            <div key={label} className="flex-1 rounded-xl bg-[#F0FDFA] p-2 text-center">
              <div className="text-lg font-bold text-[#0F766E]">{val}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      {hasEntered ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" /> Entry Confirmed
          </div>
          {draw.myEntry?.numbers?.length > 0 ? (
            <div className="mt-1">
              <p className="text-xs text-slate-500 font-medium mb-1.5">Your Entry Numbers:</p>
              <div className="flex gap-1.5">
                {/* {recentScores.map((item, index) => (
                  <div
                    key={`${item.date}-${item.score}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-600">{item.date}</span>
                    <strong className="text-lg text-[#0F766E]">{item.score}</strong>
                  </div>
                ))} */}
                {recentScores.map((item, index) => (
                  <span key={`${item.date}-${item.score}-${index}`} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {item.score}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
              Top 5 scores will be calculated and submitted when draw ends.
            </p>
          )}
        </div>
      ) : needsSub ? (
        <button
          onClick={() => onEnter(draw, "no_sub")}
          className="w-full h-11 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
        >
          <Lock className="w-4 h-4" /> Subscribe to Enter
        </button>
      ) : needsUpgrade ? (
        <button
          onClick={() => onEnter(draw, "upgrade")}
          className="w-full h-11 rounded-xl bg-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Crown className="w-4 h-4" /> Upgrade to Enter
        </button>
      ) : (
        <button
          onClick={() => onEnter(draw, "enter")}
          disabled={entering === draw._id}
          className="w-full h-11 rounded-xl bg-[#0F766E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0D6460] disabled:opacity-60 transition-colors"
        >
          {entering === draw._id ? "Entering…" : <><Ticket className="w-4 h-4" /> Enter Draw</>}
        </button>
      )
}
</div>);
}

// ─── Participated Ended Draw Card (user) ──────────────────────────────────────
function ParticipatedEndedDrawCard({ draw }) {
  const scoreHistory = useAppSelector(
  (state) => state.dashboard
);
console.log("scoreHistory:", scoreHistory);
// console.log("state.dashboard",state.dashboard);
  const auth = useAppSelector((state) => state.auth);
const [recentScoresState, setRecentScoresState] = useState([]);

useEffect(() => {
  (async () => {
    try {
      const data = await staticDataService.getDashboardStatic(auth.token);
      const payload = data?.data || data || {};

      setRecentScoresState(payload.recentScores || []);
    } catch (err) {
      console.error(err);
    }
  })();
}, [auth.token]);

const recentScores = useMemo(() => {
  const source = scoreHistory?.length
    ? [...scoreHistory]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5)
        .map((item) => ({
          date:
            item.label ||
            (item.date
              ? new Date(item.date).toLocaleDateString()
              : "Recent"),
          score: Number(item.score) || 0,
        }))
    : recentScoresState;

  return source.slice(0, 5);
}, [scoreHistory, recentScoresState]);

  const winningNums = Array.isArray(draw.randomNumber)
    ? draw.randomNumber
    : Array.isArray(draw.winningNumbers) && draw.winningNumbers.length > 0
    ? draw.winningNumbers
    : typeof draw.randomNumber === "number"
    ? [draw.randomNumber]
    : [];
    console.log("recentscoes", recentScores);
    console.log("scoreHistory:", scoreHistory);
console.log("recentScoresState:", recentScoresState);
console.log("recentScores:", recentScores);
  const isWinner = draw.myEntry?.prizeAmount > 0;

  return (
    <div className={`rounded-[24px] border p-6 flex flex-col gap-4 transition-all duration-300 ${isWinner ? "border-amber-300 bg-gradient-to-br from-amber-50/70 to-yellow-50/40 shadow-[0_8px_30px_rgba(245,158,11,0.06)]" : "border-slate-200 bg-slate-50/50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-lg leading-snug">{draw.title}</h4>
          <p className="text-sm text-slate-500 mt-1">Ended: {formatDate(draw.drawDate)}</p>
        </div>
        {isWinner && (
          <span className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-amber-500 text-white shadow-sm flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Winner
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white p-3 border border-slate-100">
          <div className="text-slate-500 text-xs">Prize Pool</div>
          <div className="font-bold text-[#0F766E] mt-0.5">{draw.prize}</div>
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-100">
          <div className="text-slate-500 text-xs">Winner</div>
          <div className="font-bold mt-0.5 text-amber-600 truncate">{draw.winnerName || "Settled"}</div>
        </div>
      </div>

      {/* Winning numbers (Random number) */}
      {winningNums.length > 0 && (
        <div className="rounded-xl bg-yellow-50/80 border border-yellow-200/60 p-4">
          <p className="text-xs font-semibold text-yellow-800 mb-2">Winning Numbers (Random Number):</p>
          <div className="flex gap-1.5">
            {winningNums.map((n) => (
              <span key={n} className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-xs">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User's entry numbers */}
      {draw.myEntry && (
        <div className="rounded-xl bg-white p-4 border border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-2">Your Entry Numbers (Recent 5 Scores):</p>
          {recentScores?.length > 0 ? (
            <div className="flex gap-1.5">
              {recentScores.map((item, index) => (
                <span key={`${item.date}-${item.score}-${index}`} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {item.score}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No scores logged before draw ended</span>
          )}
          {draw.myEntry.prizeAmount > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-700">🎉 You Won ${Number(draw.myEntry.prizeAmount).toFixed(2)}!</div>
                {draw.myEntry.tier && (
                  <div className="text-xs text-emerald-600 mt-0.5">Tier: {draw.myEntry.tier} ({draw.myEntry.matchCount} matched numbers)</div>
                )}
                <div className="text-xs text-emerald-500 mt-0.5">Prize credited to your rewards wallet.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin Draw Card ──────────────────────────────────────────────────────────
function AdminDrawCard({ draw, token, isAdmin }) {
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(draw.requiredPlan || "any");
  const timeLeft = useDrawCountdown(draw.drawDate);

  const savePlan = async () => {
    setSaving(true);
    try {
      await drawService.updateDraw(token, draw._id, { requiredPlan: plan });
      toast.success("Required plan updated.");
    } catch (e) {
      toast.error("Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = draw.status === "open"
    ? "bg-emerald-100 text-emerald-700"
    : draw.status === "completed"
    ? "bg-slate-100 text-slate-600"
    : "bg-amber-100 text-amber-700";

  return (
    <>
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-lg">{draw.title}</h4>
            <p className="text-sm text-slate-500 mt-1">{formatDate(draw.drawDate)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor}`}>{draw.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Prize</div>
            <div className="font-bold text-[#0F766E] mt-0.5">{draw.prize}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Participants</div>
            <div className="font-bold mt-0.5">{draw.participantCount ?? draw.analytics?.participants ?? 0}</div>
          </div>
        </div>

        {draw.status === "open" && (
          <div className="flex gap-2">
            {[["days", timeLeft.days], ["hrs", timeLeft.hours], ["min", timeLeft.minutes], ["sec", timeLeft.seconds]].map(([l, v]) => (
              <div key={l} className="flex-1 rounded-xl bg-[#F0FDFA] p-2 text-center">
                <div className="text-lg font-bold text-[#0F766E]">{v}</div>
                <div className="text-[10px] text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Admin: set required plan */}
        <div className="flex gap-2 items-center">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-[#0F766E]"
          >
            <option value="any">Any Subscription</option>
            <option value="monthly">Monthly Plan</option>
            <option value="yearly">Yearly Plan</option>
          </select>
          <button
            onClick={savePlan}
            disabled={saving || plan === draw.requiredPlan}
            className="h-10 px-4 rounded-xl bg-[#0F766E] text-white text-sm font-semibold disabled:opacity-50 hover:bg-[#0D6460] transition-colors"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>

        {/* View details for ended draws */}
        {(draw.status === "completed" || draw.status === "closed") && (
          <button
            onClick={() => setShowDetails(true)}
            className="w-full h-11 rounded-xl border border-[#0F766E] text-[#0F766E] font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            <Eye className="w-4 h-4" /> View Draw Details
          </button>
        )}

        {draw.randomNumber && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-xs font-semibold text-yellow-800 mb-2">🔐 Winning Numbers (Admin)</p>
            <div className="flex gap-1 flex-wrap">
              {(Array.isArray(draw.randomNumber) ? draw.randomNumber : [draw.randomNumber]).map((n) => (
                <span key={n} className="w-8 h-8 rounded-full bg-yellow-300 font-bold text-sm flex items-center justify-center">{n}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDetails && (
        <DrawDetailsModal drawId={draw._id} token={token} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <article className={`rounded-[28px] bg-white border border-slate-200 p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] ${className}`}>
      {children}
    </article>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 border border-slate-100 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
        <Icon className="h-6 w-6 text-[#0F766E]" />
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-xl font-bold">{value ?? "--"}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DrawsPage() {
  const auth = useAppSelector((state) => state.auth);
  const { token } = auth;
  
  const isAdmin = auth?.user?.role === "admin";
  const userId = auth?.user?._id || auth?.user?.id;
  
  const [hero, setHero] = useState(FALLBACK_DRAW);
  const [stats, setStats] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [prizeBreakdown, setPrizeBreakdown] = useState([]);
  const [previousResults, setPreviousResults] = useState([]);
  const [winners, setWinners] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [drawEnded, setDrawEnded] = useState(false);

  // Live draws from DB
  const [liveDraws, setLiveDraws] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [enteredDrawIds, setEnteredDrawIds] = useState(new Set());
  const [entering, setEntering] = useState(null); // drawId being entered
  const [gateModal, setGateModal] = useState(null); // draw obj shown in gate

  // Load static page data
  const loadStaticData = useCallback(async () => {
    try {
      const data = await staticDataService.getDrawsContent(token);
      const nextHero =  FALLBACK_DRAW;
      setHero(nextHero);
      setStats((data.stats || []).map((item) => ({
        ...item, icon: resolveIcon(item.icon, STAT_ICON_FALLBACKS[item.label] || Gift)
      })));
      setMyEntries(data.myEntries || []);
      setPrizeBreakdown(data.prizeBreakdown || []);
      setPreviousResults(data.previousResults || []);
      setWinners(data.winners || []);
      setAnalytics(data.analytics || null);
    } catch (e) {
      console.warn("Failed to load draws static data:", e);
    }
  }, [token]);

  // Load live draws from DB — auto-settles expired draws and fires win toasts
  const loadLiveDraws = useCallback(async () => {
    try {
      const result = await drawService.listAllDraws(token);
      let draws = result?.draws || (Array.isArray(result) ? result : []);

      // ── Auto-settle expired/uncredited draws the user entered ──────────────
      const expiredUnsettled = draws.filter((d) => {
        if (!d.hasEntered) return false;
        const deadline = d.drawDate || d.endsAt;
        const deadlinePassed = deadline && new Date(deadline) <= new Date();

        // Case 1: Open draw whose countdown has passed
        if (d.status === "open" && deadlinePassed) return true;

        // Case 2: Completed draw but prizes were never distributed
        // (settled before prize-distribution code was deployed)
        if (d.status === "completed" && (d.myEntry?.prizeAmount ?? 0) === 0) return true;

        return false;
      });

      if (expiredUnsettled.length > 0) {
        // Trigger settlement for each draw (server validates deadline + idempotency)
        await Promise.allSettled(
          expiredUnsettled.map((d) => drawService.autoSettle(token, d._id))
        );
        // Reload draws to pick up prize amounts, winner names, updated status
        const refreshed = await drawService.listAllDraws(token);
        draws = refreshed?.draws || draws;
      }

      setLiveDraws(draws);

      // ── Show winning toast once per draw (localStorage prevents duplicates) ─
      draws.forEach((d) => {
        const prize = d.myEntry?.prizeAmount ?? 0;
        // Clear stale "notified" keys for draws where prize is still 0
        // (so toast fires correctly after re-settlement)
        const key = `win_notified_${d._id}`;
        if (prize === 0) {
          localStorage.removeItem(key);
          return;
        }
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

      // ── Track entered draws ───────────────────────────────────────────────
      if (draws.length) {
        const entered = new Set(
          draws.filter((d) => d.hasEntered).map((d) => String(d._id))
        );
        setEnteredDrawIds(entered);
      }
    } catch (e) {
      console.warn("Failed to load live draws:", e);
    }
  }, [token, userId, myEntries]);

  // Load subscription info
  const loadSubscription = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await apiConnector({ method: "GET", url: "/api/v1/billing/subscription", token });
      const sub = resp?.data?.subscription || resp?.data || resp?.subscription || null;
      if (sub?.planCode) setUserSubscription(sub);
    } catch {
      // non-critical — user may have no subscription
    }
  }, [token]);

  useEffect(() => {
    loadStaticData();
    loadLiveDraws();
    loadSubscription();
    const refreshId = window.setInterval(loadLiveDraws, 10000);
    return () => window.clearInterval(refreshId);
  }, [token]); // eslint-disable-line

  const heroEndDate = hero?.endsAt || hero?.drawDate || hero?.date;
  const timeLeft = useDrawCountdown(heroEndDate);

  useEffect(() => {
    if (timeLeft.isExpired && !drawEnded) {
      setDrawEnded(true);
      toast.info("🎉 Draw has ended! See the results", { position: "top-center", autoClose: 5000 });
    }
  }, [timeLeft.isExpired, drawEnded]);

  // Handle enter button click
  const handleEnter = async (draw, mode) => {
    console.log("Clicked", mode);
    if (mode === "no_sub" || mode === "upgrade") {
      setGateModal(draw);
      return;
    }

    setEntering(draw._id);
    try {
      const entry = await drawService.enterSpecificDraw(token, draw._id);
      setEnteredDrawIds((prev) => new Set([...prev, String(draw._id)]));
      toast.success(`🎉 Entered! Your numbers: ${(entry?.numbers || []).join(", ")}`);
      loadLiveDraws();
    } catch (err) {
      if (err.message?.includes("subscription") || err.message?.includes("Subscription")) {
        setGateModal(draw);
      } else {
        toast.error(err.message || "Unable to enter the draw.");
      }
    } finally {
      setEntering(null);
    }
  };

  // A draw is "active" only if status is open AND the deadline is still in the future
  const openDraws = useMemo(() =>
    liveDraws.filter((d) => {
      if (d.status !== "open") return false;
      const deadline = d.drawDate || d.endsAt;
      if (!deadline) return true; // no date set — show as active
      return new Date(deadline) > new Date();
    }),
  [liveDraws]);

  // Past draws: any draw the user entered that is either completed OR whose countdown expired
  const endedDraws = useMemo(() =>
    liveDraws.filter((d) => {
      if (d.status !== "open") return d.hasEntered; // completed/settled — show if user entered
      const deadline = d.drawDate || d.endsAt;
      if (!deadline) return false;
      return new Date(deadline) <= new Date() && d.hasEntered; // open but expired
    }),
  [liveDraws]);


  const normalizedPrizeBreakdown = useMemo(
    () => prizeBreakdown.map((item, index) => ({
      name: item.name || item.label || `Prize ${index + 1}`,
      value: toNumber(item.value ?? item.percentage ?? item.share),
      color: item.color || ["#0F766E", "#14B8A6", "#22C55E", "#F59E0B"][index % 4]
    })).filter((item) => item.value > 0),
    [prizeBreakdown]
  );

  // Build Previous Draw Results from live settled draws + static fallback
  const normalizedResults = useMemo(() => {
    // Settled live draws come first (most recent first)
    const liveCompleted = liveDraws
      .filter((d) => d.status === "completed")
      .sort((a, b) => new Date(b.settledAt || b.drawDate) - new Date(a.settledAt || a.drawDate))
      .map((d) => ({
        id: d._id,
        draw: d.title,
        date: formatDate(d.settledAt || d.drawDate),
        numbers: Array.isArray(d.winningNumbers) ? d.winningNumbers : (Array.isArray(d.randomNumber) ? d.randomNumber : []),
        prize: d.prize || `$${Number(d.totalPool || 0).toFixed(2)}`,
        winner: d.winnerName || "No Winner",
        status: "Completed"
      }));

    // Fallback static results (exclude any that already appear from live data)
    const liveIds = new Set(liveCompleted.map((r) => r.id));
    const staticResults = previousResults
      .filter((r) => !liveIds.has(r.id || r._id))
      .map((result, index) => ({
        id: result.id || result.draw || `${result.name}-${index}`,
        draw: result.draw || result.title || result.name || "Previous draw",
        date: formatDate(result.drawDate || result.date),
        numbers: Array.isArray(result.numbers || result.winningNumbers) ? (result.numbers || result.winningNumbers) : [],
        prize: result.prize || result.prizePool || "--",
        winner: result.winner || result.winnerName || "--",
        status: result.status || "Completed"
      }));

    return [...liveCompleted, ...staticResults];
  }, [liveDraws, previousResults]);

  // Build Recent Winners from live settled draws + static fallback
  const normalizedWinners = useMemo(() => {
    // Real winners from settled live draws
    const liveWinners = liveDraws
      .filter((d) => d.status === "completed" && d.winnerName && d.winnerName !== "No Winner")
      .sort((a, b) => new Date(b.settledAt || b.drawDate) - new Date(a.settledAt || a.drawDate))
      .map((d) => ({
        id: d._id,
        name: d.winnerName,
        amount: d.prize || `$${Number(d.totalPool || 0).toFixed(2)}`,
        draw: d.title
      }));

    // Static fallback winners
    const staticWinners = winners.map((winner, index) => ({
      id: winner.id || `${winner.name}-${index}`,
      name: winner.name || winner.winner || "Winner",
      amount: winner.amount || winner.prize || "--",
      draw: winner.draw || winner.drawName || "Draw"
    }));

    return [...liveWinners, ...staticWinners];
  }, [liveDraws, winners]);

  const participantCount = analytics?.participants ?? analytics?.totalParticipants;
  const impactValue = analytics?.impact || analytics?.communityImpact || "--";
  const analyticsTrend = analytics?.trend || [];
  const winningChance = analytics?.winningChance ?? 0;
  const scoreHistory = useAppSelector(
  (state) => state.dashboard.scoreHistory
);

const [recentScoresState, setRecentScoresState] = useState([]);

useEffect(() => {
  (async () => {
    try {
      const data = await staticDataService.getDashboardStatic(auth.token);
      const payload = data?.data || data || {};

      setRecentScoresState(payload.recentScores || []);
    } catch (err) {
      console.error(err);
    }
  })();
}, [auth.token]);

const recentScores = useMemo(() => {
  const source = scoreHistory?.length
    ? [...scoreHistory]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5)
        .map((item) => ({
          date:
            item.label ||
            (item.date
              ? new Date(item.date).toLocaleDateString()
              : "Recent"),
          score: Number(item.score) || 0,
        }))
    : recentScoresState;

  return source.slice(0, 5);
}, [scoreHistory, recentScoresState]);
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-6 lg:ml-[280px]">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#111827]">Draws &amp; Competitions</h1>
          <p className="text-[#64748B] mt-2">Enter monthly draws, win rewards, and make an impact.</p>
        </div>
        {!isAdmin && !userSubscription && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">Subscribe to enter draws</span>
            <a href="/subscribe" className="ml-1 font-semibold text-[#0F766E] flex items-center gap-1 hover:underline">
              Subscribe <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        )}
        {!isAdmin && userSubscription && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
            <CheckCircle className="w-5 h-5" />
            {userSubscription.planCode === "yearly" ? "Yearly Plan — All Draws Unlocked" : "Monthly Plan — Standard Draws Unlocked"}
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Featured Hero Draw */}
        <div className="lg:col-span-12">
          <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-[32px] p-10 text-white relative overflow-hidden">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold">{hero?.name || hero?.title || "Upcoming Draw"}</h2>
                <p className="mt-2 text-sm opacity-90">Prize Pool: <strong className="text-xl">{hero?.prize || "--"}</strong></p>
                <p className="mt-1 text-sm opacity-80">80% of subscription revenue funds this pool</p>
                <p className="mt-3 text-sm opacity-80">Draw Date: <strong>{formatDate(heroEndDate)}</strong></p>

                <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                  {[["Days", timeLeft.days], ["Hours", timeLeft.hours], ["Minutes", timeLeft.minutes], ["Seconds", timeLeft.seconds]].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur-md">
                      <strong className="block text-2xl">{value}</strong>
                      <span className="text-xs text-white/75">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-xl bg-white/10 p-6 text-right">
                  <div className="text-sm opacity-80">Active Draws</div>
                  <div className="text-3xl font-bold">{openDraws.length}</div>
                  <div className="text-sm opacity-80 mt-1">Open for entry</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {stats.length > 0 && (
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
              ))}
            </div>
          </div>
        )}

        {/* ── USER: Active Draws ──────────────────────────────────────────── */}
        {!isAdmin && (
          <div className="lg:col-span-12">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Active Draws</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {openDraws.length ? `${openDraws.length} draw${openDraws.length > 1 ? "s" : ""} open for entry` : "No active draws right now"}
                  </p>
                </div>
              </div>
              {openDraws.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {openDraws.map((draw) => (
                    <ActiveDrawCard
                      key={draw._id}
                      draw={draw}
                      userSubscription={userSubscription}
                      onEnter={handleEnter}
                      entering={entering}
                      hasEntered={enteredDrawIds.has(String(draw._id))}
                      myEntry={recentScores.score}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">
                  No draws are currently open. Check back soon!
                </div>
              )}
            </Card>
            </div>)}
        {/* ── USER: Participated Ended Draws ─────────────────────────────── */}
        {!isAdmin && endedDraws.length > 0 && (
          <div className="lg:col-span-12">
            <Card>
              <h3 className="text-2xl font-bold mb-2">Past Draws You Entered</h3>
              <p className="text-slate-500 text-sm mb-6">Draws you participated in that have ended.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {endedDraws.map((draw) => (
                  <ParticipatedEndedDrawCard key={draw._id} draw={draw} />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── ADMIN: All Draws ────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            {openDraws.length > 0 && (
              <div className="lg:col-span-12">
                <Card>
                  <h3 className="text-2xl font-bold mb-6">Open Draws</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {openDraws.map((draw) => (
                      <AdminDrawCard key={draw._id} draw={draw} token={token} isAdmin={isAdmin} />
                    ))}
                  </div>
                </Card>
              </div>
            )}
            {endedDraws.length > 0 && (
              <div className="lg:col-span-12">
                <Card>
                  <h3 className="text-2xl font-bold mb-2">Ended Draws</h3>
                  <p className="text-slate-500 text-sm mb-6">Click "View Draw Details" to see all entries and the winner.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {endedDraws.map((draw) => (
                      <AdminDrawCard key={draw._id} draw={draw} token={token} isAdmin={isAdmin} />
                    ))}
                  </div>
                </Card>
              </div>
            )}
            {!liveDraws.length && (
              <div className="lg:col-span-12">
                <Card>
                  <div className="py-10 text-center text-slate-400">No draws in the database yet. Create one to get started.</div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Prize Pool Breakdown */}
        <div className="lg:col-span-6">
          <Card>
            <h3 className="text-2xl font-bold">Prize Pool Breakdown</h3>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={normalizedPrizeBreakdown} dataKey="value" innerRadius={50} outerRadius={80}>
                      {normalizedPrizeBreakdown.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1">
                {normalizedPrizeBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.value}%</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{item.value}%</div>
                  </div>
                ))}
                {!normalizedPrizeBreakdown.length && <p className="text-sm text-slate-500">Prize breakdown is not available yet.</p>}
              </div>
            </div>
          </Card>
        </div>

        {/* Draw Analytics */}
        <div className="lg:col-span-6">
          <Card>
            <h3 className="text-2xl font-bold">Draw Analytics</h3>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Total Participants</div>
                <div className="text-xl font-bold">{participantCount?.toLocaleString?.() ?? participantCount ?? "--"}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Average Entries</div>
                <div className="text-xl font-bold">{analytics?.averageEntries ?? "--"}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Largest Prize</div>
                <div className="text-xl font-bold">{analytics?.largestPrize ?? hero?.prize ?? "--"}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Community Impact</div>
                <div className="text-xl font-bold">{impactValue}</div>
              </div>
            </div>
            {analyticsTrend.length > 0 && (
              <div className="mt-6 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsTrend} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E6F6F3" />
                    <XAxis dataKey="label" hide />
                    <Tooltip />
                    <Area dataKey="value" stroke="#0F766E" fill="url(#trendFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Previous Draw Results */}
        <div className="lg:col-span-12">
          <Card>
            <h3 className="text-2xl font-bold">Previous Draw Results</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-3">Draw</th>
                    <th>Date</th>
                    <th>Winning Numbers</th>
                    <th>Prize Pool</th>
                    <th>Winner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedResults.map((result) => (
                    <tr key={result.id} className="border-t">
                      <td className="py-3 font-medium">{result.draw}</td>
                      <td>{result.date}</td>
                      <td>
                        <div className="flex gap-1">
                          {result.numbers.map((number) => (
                            <div key={`${result.id}-${number}`} className="w-8 h-8 rounded-full bg-[#F0FDFA] flex items-center justify-center font-semibold text-xs">{number}</div>
                          ))}
                        </div>
                      </td>
                      <td>{result.prize}</td>
                      <td>{result.winner}</td>
                      <td className="text-sm text-slate-600">{result.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!normalizedResults.length && <p className="py-6 text-sm text-slate-500">No previous draw results available.</p>}
            </div>
          </Card>
        </div>

        {/* Recent Winners */}
        <div className="lg:col-span-6">
          <Card>
            <h3 className="text-2xl font-bold">Recent Winners</h3>
            <div className="mt-6 space-y-4">
              {normalizedWinners.map((winner) => (
                <div key={winner.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F0FDFA] flex items-center justify-center font-semibold">{winner.name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold">{winner.name}</div>
                    <div className="text-sm text-slate-500">Won: <strong>{winner.amount}</strong> - {winner.draw}</div>
                  </div>
                  <div className="ml-auto text-sm font-semibold text-[#F59E0B]">Winner</div>
                </div>
              ))}
              {!normalizedWinners.length && <p className="text-sm text-slate-500">Recent winners will appear after the next draw.</p>}
            </div>
          </Card>
        </div>

        {/* Winning Chance */}
        <div className="lg:col-span-6">
          <div className="rounded-[28px] bg-gradient-to-r from-amber-50 to-yellow-50 p-6 border border-slate-200 h-full">
            <div className="text-sm text-slate-600">Your Winning Chance</div>
            <div className="mt-3 text-3xl font-bold">{winningChance}%</div>
            <div className="mt-4 h-4 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#0F766E]" style={{ width: `${Math.min(100, winningChance)}%` }} />
            </div>
            <div className="mt-3 text-sm text-slate-500">Based on your active entries</div>
          </div>
        </div>
      </div>
        
      {/* Subscription Gate Modal */}
      {/* {console.log("gateModal =", gateModal)} */}
      {gateModal && (
        <SubscriptionGateModal draw={gateModal} onClose={() => setGateModal(null)} />
      )}
    </div>

  )
}
