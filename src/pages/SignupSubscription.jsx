import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { signupUser } from "../features/auth/authSlice";
import { billingService } from "../services/billingService";
import { staticDataService } from "../services/staticDataService";
import { SUBSCRIPTION_PLANS } from "../constants/config";
import { getDashboardPath } from "../utils/roles";

function openRazorpayCheckout({ checkout, userData, selectedPlan, onSuccess }) {
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script failed to load.");
  }

  const options = {
    key: checkout.keyId,
    subscription_id: checkout.subscriptionId,
    name: "Impact Performance System",
    description: `Subscription: ${selectedPlan}`,
    prefill: {
      name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
      email: userData.email
    },
    theme: { color: "#00d0ae" },
    handler() {
      onSuccess();
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

function SignupSubscription() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const userData = location.state || {};
  const isCharity = userData.accountType === "Charity";
  const hasSelectedCharity = !!userData.selectedCharityName;
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [signupPlans, setSignupPlans] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getSignupPlans();
        if (data && data.plans) {
          setSignupPlans(data.plans);
        } else {
          // Fallback to config constants
          setSignupPlans([
            {
              code: SUBSCRIPTION_PLANS.MONTHLY.code,
              name: SUBSCRIPTION_PLANS.MONTHLY.name,
              price: SUBSCRIPTION_PLANS.MONTHLY.displayPrice,
              note: SUBSCRIPTION_PLANS.MONTHLY.note
            },
            {
              code: SUBSCRIPTION_PLANS.YEARLY.code,
              name: SUBSCRIPTION_PLANS.YEARLY.name,
              price: SUBSCRIPTION_PLANS.YEARLY.displayPrice,
              note: SUBSCRIPTION_PLANS.YEARLY.note
            }
          ]);
        }
      } catch (e) {
        console.warn("Failed to load signup plans, falling back to defaults", e);
        // Fallback to config constants
        setSignupPlans([
          {
            code: SUBSCRIPTION_PLANS.MONTHLY.code,
            name: SUBSCRIPTION_PLANS.MONTHLY.name,
            price: SUBSCRIPTION_PLANS.MONTHLY.displayPrice,
            note: SUBSCRIPTION_PLANS.MONTHLY.note
          },
          {
            code: SUBSCRIPTION_PLANS.YEARLY.code,
            name: SUBSCRIPTION_PLANS.YEARLY.name,
            price: SUBSCRIPTION_PLANS.YEARLY.displayPrice,
            note: SUBSCRIPTION_PLANS.YEARLY.note
          }
        ]);
      }
    })();
  }, []);

  if (!userData.email || !userData.otp || !userData.firstName || !userData.password) {
    navigate("/signup");
    return null;
  }

  const handlePlanChange = (event) => {
    setSelectedPlan(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const session = await dispatch(
        signupUser({ ...userData, plan: selectedPlan })
      ).unwrap();

      try {
        // Razorpay temporarily disabled
  // const checkout = checkoutPayload?.checkout;

  // if (checkout?.subscriptionId && checkout?.keyId) {
  //   openRazorpayCheckout({
  //     checkout,
  //     userData,
  //     selectedPlan,
  //     onSuccess: () => {
  //       alert("Payment successful.");
  //       navigate(getDashboardPath(session.user));
  //     }
  //   });
  //   return;
  // }
      } catch (checkoutError) {
        console.warn("Checkout unavailable after signup:", checkoutError);
        alert(
          "Account created. Subscription checkout is not configured yet — you can set up billing from the dashboard after login."
        );
        navigate(getDashboardPath(session.user));
        return;
      }

      navigate(getDashboardPath(session.user));
    } catch {
      // Error surfaced via Redux auth.error
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="product-tag">Impact Performance System</span>
          <h1>{isCharity ? "Select Your Charity Plan" : "Choose Your Plan"}</h1>
          <p>
            {isCharity
              ? "Choose a subscription plan. 10% of your subscription revenue will support charitable impact."
              : "Select a subscription plan that best fits your needs."}
          </p>
          <button
            className="text-button"
            type="button"
            onClick={() => navigate("/signup/details", { state: userData })}
          >
            Back to Details
          </button>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <fieldset className="plan-picker">
              <legend>Subscription plan</legend>
              {signupPlans.map((plan) => (
                <label key={plan.code} className={selectedPlan === plan.code ? "selected" : ""}>
                  <input
                    name="plan"
                    type="radio"
                    value={plan.code}
                    checked={selectedPlan === plan.code}
                    onChange={handlePlanChange}
                  />
                  <span>
                    <strong>{plan.name}</strong>
                    <em>{plan.price}</em>
                    <small>{plan.note}</small>
                    {(isCharity || hasSelectedCharity) && <small style={{ color: "#00d0ae", fontWeight: "500" }}>10% goes to your charity</small>}
                  </span>
                </label>
              ))}
            </fieldset>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="action action-solid auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing Up..." : "Complete Signup"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SignupSubscription;

