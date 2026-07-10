import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Apple, BarChart3, Chrome, Gift, Heart, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, loginUser } from "../features/auth/authSlice";
import { getDashboardPath } from "../utils/roles";
import golferImage from "../assets/golfer.png";

function AuthScreen({ mode = "login" }) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
// const token = useAppSelector((state) => state.auth.token);
  // console.log(token);
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const isSignup = mode === "signup";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const session = await dispatch(
        loginUser({
          email: form.email,
          password: form.password
        })
      ).unwrap();

      navigate(getDashboardPath(session.user));
    } catch {
      // Error is shown from Redux auth state.
    }
  };

  const handleGoogleLogin = async () => {
    // 1. Trigger Google login flow (using @react-oauth/google or native script)
    // 2. Receive credential (JWT)
    // 3. Send to Python Backend:
    // try {
    //   const response = await fetch("http://localhost:8000/api/v1/auth/google", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ token: "RECEIVED_GOOGLE_TOKEN" })
    //   });
    //   const data = await response.json();
    //   if (data.status === "success") navigate("/dashboard");
    // } catch (err) { console.error(err); }
    console.log("Google login triggered - needs SDK integration");
  };

  const handleAppleLogin = () => {
    console.log("Apple login triggered - needs SDK integration");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <section className="grid w-full max-w-[1440px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:grid-cols-2">
        <aside className="flex flex-col justify-between border-slate-200 bg-[#FAFCFB] p-6 sm:p-8 lg:border-r lg:p-12">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Fairway Impact" className="h-14" />
              <h2 className="text-3xl font-bold text-[#111827]">
                Fairway <span className="text-[#0F766E]">Impact</span>
              </h2>
            </Link>

            <div className="mt-10">
              <h1 className="text-4xl font-bold leading-tight text-[#111827] sm:text-5xl">
                Welcome Back
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#64748B]">
                Continue tracking your performance, earning rewards, and creating impact.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              <Feature icon={BarChart3} title="Track Performance">
                Monitor every score and performance trend.
              </Feature>
              <Feature icon={Gift} title="Earn Rewards">
                Participate in monthly draws and rewards.
              </Feature>
              <Feature icon={Heart} title="Create Impact">
                Support meaningful causes through your game.
              </Feature>
            </div>
          </div>

          <div>
            <div className="mt-12 overflow-hidden rounded-[20px]">
              <img
                src={golferImage}
                alt="Golfer swinging on a course"
                className="h-[260px] w-full object-cover sm:h-[320px]"
              />
            </div>

            <div className="mt-6 flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#0F766E]" />
              <div>
                <h4 className="font-semibold text-[#111827]">Secure Login</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Protected with enterprise-grade encryption.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <form
            className="w-full max-w-[520px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_15px_40px_rgba(15,118,110,0.08)] sm:p-10"
            onSubmit={handleSubmit}
          >
            <h2 className="text-center text-4xl font-bold text-[#111827]">
             Sign In
            </h2>
            <p className="mt-3 text-center text-[#64748B]">
              Access your Impact Performance account
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-medium text-[#111827] transition hover:border-[#0F766E]"
              >
                <Chrome className="h-5 w-5" />
                Google
              </button>
              <button
                type="button"
                onClick={handleAppleLogin}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-medium text-[#111827] transition hover:border-[#0F766E]"
              >
                <Apple className="h-5 w-5" />
                Apple
              </button>
            </div>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-400">or sign in with email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <label className="text-sm font-medium text-[#111827]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-[#0F766E] focus:ring-4 focus:ring-emerald-100"
              required
            />

            <label className="mt-6 block text-sm font-medium text-[#111827]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-[#0F766E] focus:ring-4 focus:ring-emerald-100"
              required
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-[#111827]">
                <input type="checkbox" className="h-4 w-4 accent-[#0F766E]" />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-[#0F766E]">
                Forgot Password?
              </Link>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

            <button
              className="mt-8 h-14 w-full rounded-xl bg-[#0F766E] font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Sign In"}
            </button>

            <p className="mt-8 text-center text-slate-500">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                className="ml-1 font-semibold text-[#0F766E]"
                onClick={() => {
                  dispatch(clearAuthError());
                  navigate("/signup");
                }}
              >
              Create Account
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <Icon className="h-6 w-6 text-emerald-700" />
      </div>

      <div>
        <h4 className="font-semibold text-[#111827]">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">{children}</p>
      </div>
    </div>
  );
}

export default AuthScreen;


