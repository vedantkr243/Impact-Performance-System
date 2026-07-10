import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import OtpInput from "../components/OtpInput";
import { clearAuthError, sendOtp, verifyOtp } from "../features/auth/authSlice";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

function SignupOTPVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const submitOtp = async (code) => {
    if (code.length !== OTP_LENGTH || loading) {
      return;
    }

    setLoading(true);
    dispatch(clearAuthError());

    try {
      const resultAction = await dispatch(verifyOtp({ email, otp: code }));
      if (verifyOtp.fulfilled.match(resultAction)) {
        navigate("/signup/details", { state: { email, otp: code } });
      }
    } catch (err) {
      console.error("Failed to verify OTP:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digitsOnly);

    if (digitsOnly.length === OTP_LENGTH) {
      submitOtp(digitsOnly);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitOtp(otp);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading || !email) {
      return;
    }

    setResendLoading(true);
    setResendMessage("");
    dispatch(clearAuthError());
    setOtp("");

    try {
      const resultAction = await dispatch(sendOtp({ email }));
      if (sendOtp.fulfilled.match(resultAction)) {
        const emailSent = resultAction.payload?.emailSent;
        setResendMessage(
          emailSent
            ? "A new OTP has been sent to your email."
            : "New OTP generated. Check the server terminal if email did not arrive."
        );
        setResendCooldown(RESEND_COOLDOWN_SEC);
      }
    } catch (err) {
      console.error("Failed to resend OTP:", err);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  const isComplete = otp.length === OTP_LENGTH;
  const resendDisabled = resendLoading || resendCooldown > 0 || loading;

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="product-tag">Impact Performance System</span>
          <h1>Verify OTP</h1>
          <p>An OTP has been sent to {email}. Enter the 6-digit code below.</p>
          <button
            className="text-button text-button-alt"
            type="button"
            onClick={() => navigate("/signup")}
          >
            Change Email
          </button>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="otp-field">
              <span>Enter 6-digit OTP</span>
              <OtpInput value={otp} onChange={handleOtpChange} disabled={loading} />
            </div>

            <div className="otp-resend-row">
              <button
                className="text-button text-button-resend"
                type="button"
                onClick={handleResendOtp}
                disabled={resendDisabled}
              >
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : "Resend OTP"}
              </button>
            </div>

            {resendMessage ? <p className="form-success">{resendMessage}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button
              className="action action-solid auth-submit"
              type="submit"
              disabled={loading || !isComplete}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SignupOTPVerification;
