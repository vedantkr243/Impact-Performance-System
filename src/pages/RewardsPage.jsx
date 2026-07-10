import { useEffect, useMemo, useState } from "react";
import { Wallet, Gift, Star, Award, HandHeart } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { staticDataService } from "../services/staticDataService";

function Card({ children, className = "" }) {
  return (
    <article className={`rounded-[28px] bg-white border border-slate-200 p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] ${className}`}>
      {children}
    </article>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 border border-slate-100 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
        <Icon className="h-6 w-6 text-[#0F766E]" />
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`text-xl font-bold ${accent ?? ""}`}>{value}</div>
      </div>
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const TIER_BENEFITS = {
  Bronze: ["Starter rewards", "Standard marketplace access", "Charity point boosts"],
  Silver: ["Priority rewards", "Bonus draw entries", "Charity point boosts"],
  Gold: ["Priority rewards", "Bonus draw entries", "Exclusive promotions"],
  Platinum: ["Premium reward access", "Maximum draw boosts", "Exclusive promotions"]
};

export default function RewardsPage() {
  const { token } = useAppSelector((state) => state.auth);
  const [featured, setFeatured] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [wallet, setWallet] = useState({
    balance: "$0.00",
    lifetime: "$0.00",
    redeemed: "0 pts",
    tier: "Bronze",
    points: 0,
    tierGoal: 1000,
    rewardsEarned: 0,
    charityImpact: "$0",
    charityPointsRate: 10,
    scorePointsRate: 50
  });
  const [charityAmount, setCharityAmount] = useState("");
  const [localCharityPoints, setLocalCharityPoints] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getRewardsContent(token);
        setFeatured(data.featured || []);
        setMarketplace(data.marketplace || []);
        setAchievements(data.achievements || []);
        setHistory(data.history || []);
        setRecommendations(data.recommendations || []);
        setWallet((current) => ({ ...current, ...(data.wallet || {}) }));
      } catch (e) {
        console.warn("Failed to load rewards data:", e);
      }
    })();
  }, [token]);

  const totalPoints = Number(wallet.points || 0) + localCharityPoints;
  const tierGoal = Number(wallet.tierGoal || 1000);
  const progress = tierGoal ? Math.min(100, Math.round((totalPoints / tierGoal) * 100)) : 0;
  const unlockedAchievementPoints = useMemo(
    () => achievements.filter((item) => item.unlocked).reduce((sum, item) => sum + Number(item.pts || 0), 0),
    [achievements]
  );
  const visibleRecommendations = recommendations.length
    ? recommendations
    : marketplace.slice(0, 3).map((item) => ({ id: item.id, title: item.title, points: item.points }));
  const charityPreviewPoints = Math.floor(Number(charityAmount || 0) * Number(wallet.charityPointsRate || 10));

  const handleCharityBoost = (event) => {
    event.preventDefault();
    const amount = Number(charityAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    setLocalCharityPoints((current) => current + Math.floor(amount * Number(wallet.charityPointsRate || 10)));
    setWallet((current) => ({
      ...current,
      charityImpact: formatMoney(Number(String(current.charityImpact || "0").replace(/[^0-9.-]/g, "")) + amount)
    }));
    setCharityAmount("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-6 lg:ml-[280px]">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#111827]">Rewards Center</h1>
          <p className="text-[#64748B] mt-2">Redeem rewards earned through performance and impact.</p>
        </div>
        <button className="h-12 px-6 rounded-xl bg-[#0F766E] text-white font-semibold hover:bg-[#115E59] transition">Redeem Rewards</button>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-[32px] p-10 text-white">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-sm opacity-90">Available Rewards Balance</div>
                <div className="mt-2 text-4xl font-bold">{wallet.balance}</div>
                <div className="mt-4 grid grid-cols-1 gap-3 max-w-[720px] sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-3">Lifetime Rewards<br/><strong>{wallet.lifetime}</strong></div>
                  <div className="rounded-2xl bg-white/10 p-3">Redeemed<br/><strong>{wallet.redeemed}</strong></div>
                  <div className="rounded-2xl bg-white/10 p-3">Tier<br/><strong>{wallet.tier}</strong></div>
                </div>

                <div className="mt-6">
                  <button className="h-12 px-6 rounded-xl bg-white text-[#0F766E] font-semibold">Browse Marketplace</button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-right">
                  <div className="text-sm">Points</div>
                  <div className="text-5xl font-bold">{formatNumber(totalPoints)}</div>
                  <div className="mt-4 text-sm">Progress to next tier: {formatNumber(totalPoints)}/{formatNumber(tierGoal)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat icon={Wallet} label="Available Balance" value={wallet.balance} />
            <Stat icon={Gift} label="Rewards Earned" value={formatNumber(wallet.rewardsEarned)} />
            <Stat icon={Star} label="Achievement Points" value={formatNumber(totalPoints)} />
            <Stat icon={Award} label="Loyalty Tier" value={wallet.tier} accent="text-[#F59E0B]" />
          </div>
        </div>

        <div className="lg:col-span-12">
          <h2 className="text-2xl font-bold">Featured Rewards</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {featured.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <img src={item.image} alt={item.title} className="h-56 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <div className="text-sm text-slate-500">{item.value}</div>
                      <div className="mt-2 text-sm text-slate-600">Points Required: <strong>{formatNumber(item.points)}</strong></div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block rounded-2xl px-3 py-1 text-sm font-semibold bg-[#ECFDF5] text-[#16A34A]">{item.badge}</div>
                      <div className="mt-4">
                        <button disabled={totalPoints < Number(item.points || 0)} className="h-10 rounded-xl bg-[#0F766E] px-4 text-white disabled:cursor-not-allowed disabled:bg-slate-300">Redeem Now</button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12">
          <Card>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h3 className="text-2xl font-bold">Rewards Marketplace</h3>
              <div className="flex flex-wrap items-center gap-3">
                {["All", "Golf", "Travel", "Experiences", "Merchandise", "Gift Cards"].map((category) => (
                  <button key={category} className="rounded-full border border-slate-200 px-3 py-1 text-sm">{category}</button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {marketplace.map((item) => (
                <div key={item.id} className="bg-white rounded-[24px] border border-slate-200 p-4">
                  <div className="h-28 w-full rounded-md bg-slate-50 flex items-center justify-center mb-3">Image</div>
                  <div className="text-lg font-semibold">{item.title}</div>
                  <div className="text-sm text-slate-500">{formatNumber(item.points)} Points</div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">{item.stock}</div>
                    <button disabled={totalPoints < Number(item.points || 0)} className="h-10 rounded-xl bg-[#0F766E] px-4 text-white disabled:cursor-not-allowed disabled:bg-slate-300">Redeem</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <h3 className="text-2xl font-bold">Achievements</h3>
            <div className="mt-2 text-sm text-slate-500">Unlocked points: {formatNumber(unlockedAchievementPoints)}</div>
            <div className="mt-4 space-y-3">
              {achievements.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#F8FAFC] p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-slate-500">{formatNumber(item.pts)} pts</div>
                  </div>
                  <div>{item.unlocked ? <div className="text-sm text-[#16A34A]">Unlocked</div> : <div className="text-sm text-slate-500">Locked</div>}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[28px] bg-gradient-to-r from-amber-50 to-yellow-50 p-6 border border-slate-200">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm text-slate-600">Loyalty Status</div>
                <h3 className="mt-2 text-2xl font-bold">{wallet.tier} Member</h3>
                <div className="mt-2 text-sm text-slate-600">{formatNumber(totalPoints)} / {formatNumber(tierGoal)} Points</div>
                <div className="mt-3 h-3 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 text-sm space-y-1">
                  {(TIER_BENEFITS[wallet.tier] || TIER_BENEFITS.Bronze).map((benefit) => (
                    <div key={benefit}>? {benefit}</div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-[#B45309] font-bold">{wallet.tier}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <Card>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-bold">Charity Boost</h3>
                <p className="mt-1 text-sm text-slate-600">Support charity with any amount and add reward points to your account.</p>
              </div>
              <form onSubmit={handleCharityBoost} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="1"
                    value={charityAmount}
                    onChange={(event) => setCharityAmount(event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 pl-8 pr-4 sm:w-44"
                    placeholder="Amount"
                  />
                </label>
                <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 font-semibold text-white">
                  <HandHeart className="h-5 w-5" />
                  Add Charity
                </button>
              </form>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Current Charity Impact</div>
                <div className="text-xl font-bold">{wallet.charityImpact}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">Points Per $1</div>
                <div className="text-xl font-bold">{wallet.charityPointsRate}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="text-sm text-slate-500">This Boost Adds</div>
                <div className="text-xl font-bold">{formatNumber(charityPreviewPoints)} pts</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-12">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Reward History</h3>
              <div className="flex gap-3 items-center">
                <button className="h-10 rounded-xl border border-slate-200 px-4 text-sm">Filter</button>
                <button className="h-10 rounded-xl bg-[#0F766E] px-4 text-white">Export</button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-3">Date</th>
                    <th>Reward</th>
                    <th>Category</th>
                    <th>Points Used</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={`${item.date}-${item.reward}`} className="border-t">
                      <td className="py-3 font-medium">{item.date}</td>
                      <td>{item.reward}</td>
                      <td>{item.category}</td>
                      <td className="font-semibold">{formatNumber(item.points)}</td>
                      <td className={`${item.status === "Redeemed" ? "text-[#16A34A]" : item.status === "Pending" ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!history.length ? <p className="py-6 text-sm text-slate-500">No reward redemptions yet.</p> : null}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <h3 className="text-2xl font-bold">Reward Insights</h3>
            <div className="mt-4 space-y-3">
              <div className="text-sm text-slate-500">Most Redeemed Category</div>
              <div className="text-lg font-bold">{history[0]?.category || "No redemptions yet"}</div>
              <div className="mt-3 text-sm text-slate-500">Score Activity Rate</div>
              <div className="text-lg font-bold">{wallet.scorePointsRate} pts per score</div>
              <div className="mt-3 text-sm text-slate-500">Charity Points Added</div>
              <div className="text-lg font-bold">+{formatNumber(localCharityPoints)}</div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-[28px] bg-[#F0FDFA] p-6 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">Recommended For You</h3>
                <p className="text-sm text-slate-600 mt-1">Based on your points, activity, and performance trends.</p>
              </div>
              <div className="text-[#0F766E] font-semibold">AI</div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleRecommendations.map((item) => (
                <div key={item.id} className="rounded-xl bg-white p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">{item.title}</div>
                    <div className="font-semibold">{formatNumber(item.points)} Points</div>
                  </div>
                  <button className="h-10 rounded-xl bg-[#0F766E] px-3 text-white">View Reward</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
