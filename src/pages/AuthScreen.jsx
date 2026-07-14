import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Apple, BarChart3, Chrome, Gift, Heart, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, loginUser } from "../features/auth/authSlice";
import { getDashboardPath } from "../utils/roles";
import golferImage from "../assets/golfer.png";
import { useAuth0 } from "@auth0/auth0-react";
import { auth0LoginSuccess } from "../features/auth/authSlice";
import { authService } from "../services/authService";

function AuthScreen({ mode = "login" }) {
  const [form, setForm] = useState({
  email: "",
  password: "",
});
const {
  loginWithRedirect,
  isLoading,
  isAuthenticated,
  user,
  error:auth0Error,
  getAccessTokenSilently,
} = useAuth0();
  const dispatch = useAppDispatch();
  const { loading, error:reduxError } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();



  const isSignup = mode === "signup";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(getDashboardPath(result.payload.user));
    }
  };

  useEffect(() => {
  const loginWithAuth0 = async () => {
    if (!isAuthenticated || !user) return;

    try {
     
      const accessToken = await getAccessTokenSilently();


      // const result = await dispatch(auth0LoginSuccess(accessToken));


      // console.log(result);

      // if (auth0LoginSuccess.fulfilled.match(result)) {
      //   console.log("✅ Backend Login Success");
      //   console.log(result.payload);

      //   navigate(getDashboardPath(result.payload.user));
      // } 
      const session = await authService.auth0GetMe(user);
        navigate(getDashboardPath(user));
      
    } catch (err) {
      console.log("❌ Exception");
      console.error(err);
    }
  };

  loginWithAuth0();
}, [isAuthenticated, user]);


  const handleGoogleLogin = async () => {

  try {
    await loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
      },
    });

  } catch (err) {
    console.error("loginWithRedirect Error:", err);
  }
};

  const handleAppleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: "apple",
      },
    });
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
                className="flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <GoogleLogo />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleAppleLogin}
                className="flex h-12 items-center justify-center gap-3 rounded-xl bg-black px-4 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1c1c1e] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <AppleLogo />
                Continue with Apple
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
              {/* <Link to="/forgot-password" className="text-sm font-medium text-[#0F766E]">
                Forgot Password?
              </Link> */}
            </div>

            {reduxError ? <p className="mt-4 text-sm font-medium text-red-600">{reduxError}</p> : null}

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

function GoogleLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg className="h-5 w-5 fill-current text-white shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.72-1.16 1.86-1.02 2.97 1.12.09 2.27-.58 2.97-1.42z"/>
    </svg>
  );
}

export default AuthScreen;


