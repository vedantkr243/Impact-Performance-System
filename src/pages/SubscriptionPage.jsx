import React, { useMemo, useState } from "react";
import { Bell, Search, AlertCircle } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { billingService } from "../services/billingService";
import { SUBSCRIPTION_PLANS, calculateMonthlyContribution } from "../constants/config";

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve();

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

async function openRazorpayCheckout({ checkout, user, selectedPlan, onSuccess }) {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script failed to load. Check your internet connection or ad blocker.");
  }

  const options = {
    key: checkout.keyId,
    subscription_id: checkout.subscriptionId,
    name: "Impact Performance System",
    description: `Subscription: ${selectedPlan}`,
    prefill: {
      name: user?.name || checkout.customer?.name || "",
      email: user?.email || checkout.customer?.email || ""
    },
    theme: { color: "#00d0ae" },
    handler() {
      onSuccess();
    },
    modal: {
      ondismiss() {
        console.info("Razorpay checkout closed by user.");
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

const fallbackPlans = [
  {
    code: SUBSCRIPTION_PLANS.MONTHLY.code,
    name: SUBSCRIPTION_PLANS.MONTHLY.name,
    price: SUBSCRIPTION_PLANS.MONTHLY.price,
    displayPrice: SUBSCRIPTION_PLANS.MONTHLY.displayPrice,
    note: SUBSCRIPTION_PLANS.MONTHLY.note
  },
  {
    code: SUBSCRIPTION_PLANS.YEARLY.code,
    name: SUBSCRIPTION_PLANS.YEARLY.name,
    price: SUBSCRIPTION_PLANS.YEARLY.price,
    displayPrice: SUBSCRIPTION_PLANS.YEARLY.displayPrice,
    note: SUBSCRIPTION_PLANS.YEARLY.note
  }
];

function SubscriptionPage() {
  const { subscription, billingPlans, monthlyTrack } = useAppSelector((state) => state.dashboard);
  const { token, user } = useAppSelector((state) => state.auth);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const currentPlanName = subscription?.plan || "No plan";
  const renewal = subscription?.renewsOn || "Not scheduled";
  const contribution = monthlyTrack?.[0]?.value || "$0";

  const plans = useMemo(() => {
    const source = billingPlans?.length ? billingPlans : fallbackPlans;

    return source
      .filter((plan) => ["monthly", "yearly"].includes(plan.code))
      .map((plan) => {
        const fallback = plan.code === "yearly" ? SUBSCRIPTION_PLANS.YEARLY : SUBSCRIPTION_PLANS.MONTHLY;
        return {
          ...plan,
          name: plan.name || fallback.name,
          displayPrice: plan.displayPrice || (plan.price ? `$${plan.price}` : fallback.displayPrice),
          note: plan.note || fallback.note,
          contribution: `$${calculateMonthlyContribution(plan.code).toFixed(2)} / month to charity`
        };
      });
  }, [billingPlans]);

  const handleCheckout = async (planCode) => {
    if (!token) {
      const message = "Please login again before starting checkout.";
      setCheckoutError(message);
      alert(message);
      return;
    }

    setCheckoutError(null);
    setCheckoutPlan(planCode);

    try {
      const checkoutPayload = await billingService.createCheckoutSession(token, planCode);
      const checkout = checkoutPayload?.checkout;

      if (checkout?.provider === "mock") {
        alert("Subscription activated in mock billing mode.");
        window.location.reload();
        return;
      }

      if (!checkout?.subscriptionId || !checkout?.keyId) {
        throw new Error("Checkout is not configured for this plan. Check Razorpay key and plan environment variables.");
      }

      await openRazorpayCheckout({
        checkout,
        user,
        selectedPlan: planCode,
        onSuccess: () => {
          alert("Payment successful. Your subscription is activating.");
          window.location.reload();
        }
      });
    } catch (error) {
      const message = error?.message || "Unable to start subscription checkout.";
      console.error("Subscription checkout failed:", error);
      setCheckoutError(message);
      alert(message);
    } finally {
      setCheckoutPlan(null);
    }
  };

  return (
    <div className="p-6 lg:p-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <input
            className="h-10 w-[300px] rounded-lg border border-slate-200 px-4 pr-10 text-sm"
            placeholder="Search anything..."
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded p-2 text-slate-600 hover:bg-slate-100" type="button">
            <Bell size={20} />
          </button>
          <div className="text-sm text-slate-600">{user ? user.name : "Guest"}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div
            className="rounded-xl p-6 text-white"
            style={{ background: "linear-gradient(135deg,#005B66,#003B44)" }}
          >
            <h3 className="text-sm opacity-90">Current Plan</h3>
            <h2 className="mt-3 text-2xl font-bold">{currentPlanName}</h2>
            <p className="mt-2 text-lg font-semibold">{contribution} / month</p>
            <p className="mt-2 text-sm opacity-90">Renews on {renewal}</p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h4 className="text-sm font-semibold">Billing Summary</h4>
            <div className="mt-3 text-sm">
              <div className="flex justify-between">
                <span>Next Billing Date</span>
                <strong>{renewal}</strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Amount</span>
                <strong>{contribution}</strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Status</span>
                <strong>{subscription?.status || "Not active"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Choose Subscription</h3>
            {checkoutError ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {checkoutError}
              </div>
            ) : null}

            {subscription?.isActive ? (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>You already have an active draw entry slot. You can enter any active draw. Once you enter a draw, you can subscribe again.</span>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <article key={plan.code} className="rounded-lg border border-slate-200 p-5">
                  <h4 className="text-xl font-semibold text-slate-900">{plan.name}</h4>
                  <p className="mt-2 text-2xl font-bold text-[#0F766E]">{plan.displayPrice}</p>
                  <p className="mt-2 min-h-12 text-sm text-slate-500">{plan.note}</p>
                  <p className="mt-3 text-sm font-medium text-emerald-700">{plan.contribution}</p>
                  <button
                    className="mt-5 h-11 w-full rounded-md bg-[#0F766E] font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    onClick={() => handleCheckout(plan.code)}
                    disabled={Boolean(checkoutPlan) || subscription?.isActive}
                  >
                    {checkoutPlan === plan.code ? "Starting checkout..." : "Subscribe"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;

