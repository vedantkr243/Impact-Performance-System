import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { sendOtp } from "../features/auth/authSlice";

function SignupEmailVerification() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resultAction = await dispatch(sendOtp({ email }));
      if (sendOtp.fulfilled.match(resultAction)) {
        // OTP sent successfully, navigate to OTP verification page
        navigate("/signup/verify-otp", { state: { email } });
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      // Error message will be handled by authSlice state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="product-tag">Impact Performance System</span>
          <h1>Verify Your Email</h1>
          <p>
            Enter your email address to receive a One-Time Password (OTP) for
            registration.
          </p>
          <button className="text-button" type="button" onClick={() => navigate("/")}>
            Back to home
          </button>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="action action-solid auth-submit" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SignupEmailVerification;