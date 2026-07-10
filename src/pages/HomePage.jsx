import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Play, Star } from "lucide-react";
import abstractGreenGradient1 from "../assets/abstract_green_gradient_1.png";
import abstractGreenGradient2 from "../assets/abstract_green_gradient_2.png";
import glowOverlay1 from "../assets/glow_overlay_1.png";
import glowOverlay2 from "../assets/glow_overlay_2.png";
import golfLinePattern1 from "../assets/golf_line_pattern_1.png";
import golfLinePattern2 from "../assets/golf_line_pattern_2.png";
import heroImage from "../assets/heroimages.png";

import { staticDataService } from "../services/staticDataService";
import { withIcons } from "../utils/iconMap";

export default function HomePage() {

  const navigate = useNavigate();

  const [trustMetrics, setTrustMetrics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [signupPlans, setSignupPlans] = useState([]);
  const [impactStats, setImpactStats] = useState([]);
  const [howItWorks, setHowItWorks] = useState([]);

  useEffect(() => {

    (async () => {

      try {

        const data = await staticDataService.getHomeContent();

        if (data.trustMetrics)
          setTrustMetrics(withIcons(data.trustMetrics));

        if (data.features)
          setFeatures(withIcons(data.features));

        if (data.signupPlans)
          setSignupPlans(data.signupPlans);

        if (data.impactStats)
          setImpactStats(data.impactStats);

        if (data.howItWorks)
          setHowItWorks(data.howItWorks);

      } catch (err) {

        console.error(err);

      }

    })();

  }, []);

  return (

    <div className="relative min-h-screen overflow-hidden bg-[#07120D] text-white">

      {/* Background */}

      <img
        src={abstractGreenGradient1}
        className="absolute top-0 left-0 w-[650px] opacity-60 pointer-events-none"
        alt=""
      />

      <img
        src={abstractGreenGradient2}
        className="absolute right-0 top-0 w-[700px] opacity-70 pointer-events-none"
        alt=""
      />

      <img
        src={glowOverlay1}
        className="absolute left-0 top-0 opacity-40"
        alt=""
      />

      <img
        src={glowOverlay2}
        className="absolute right-0 bottom-0 opacity-40"
        alt=""
      />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${golfLinePattern1})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      <div
        className="absolute bottom-0 right-0 opacity-10"
        style={{
          backgroundImage: `url(${golfLinePattern2})`,
          width: "600px",
          height: "600px",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ================= NAVBAR ================= */}

      <header className="relative z-50 w-full">

        <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-7 px-6">

          <h1 className="text-3xl font-black tracking-wider">

            FAIRWAY

            <span className="text-emerald-400">

              {" "}IMPACT

            </span>

          </h1>

          <nav className="hidden lg:flex items-center gap-10">

            <a href="#features" className="hover:text-emerald-400 transition">

              Features

            </a>

            <a href="#how-it-works" className="hover:text-emerald-400 transition">

              How It Works

            </a>

            <Link
              to="/prize-pool"
              className="hover:text-emerald-400 transition"
            >

              Rewards

            </Link>

            <Link
              to="/charity"
              className="hover:text-emerald-400 transition"
            >

              Charity

            </Link>

            <a href="#plans" className="hover:text-emerald-400 transition">

              Pricing

            </a>

          </nav>

          <div className="flex gap-4">

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-full border border-emerald-400 hover:bg-emerald-400 hover:text-black transition"
            >

              Login

            </button>

            <button
              onClick={() => navigate("/signup")}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-6 py-2 font-semibold shadow-xl hover:scale-105 transition"
            >

              Get Started

            </button>

          </div>

        </div>

      </header>

      {/* ================= HERO ================= */}

      <section className="relative z-20 max-w-7xl mx-auto min-h-[90vh] flex items-center px-6">

        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* LEFT */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 mb-8">

              <Star className="text-yellow-400" size={18} />

              <span className="text-sm">

                Trusted by 1000+ Golfers Worldwide

              </span>

            </div>

            <h1 className="text-6xl md:text-7xl font-black leading-tight">

              Better

              <br />

              Performance.

              <br />

              <span className="text-emerald-400">

                Better Rewards.

              </span>

            </h1>

            <p className="mt-8 text-gray-300 text-xl leading-9 max-w-xl">

              Fairway Impact helps golfers improve their game,
              win exciting rewards,
              and contribute towards meaningful charitable causes
              every single month.

            </p>

            <div className="flex flex-wrap gap-6 mt-12">

              <button

                onClick={() => navigate("/signup")}

                className="bg-gradient-to-r from-emerald-500 to-green-400 rounded-full px-8 py-4 flex items-center gap-3 font-bold shadow-2xl hover:scale-105 transition"

              >

                Start Free

                <ArrowRight size={20} />

              </button>

              <button

                onClick={() => navigate("/login")}

                className="rounded-full border border-white/30 backdrop-blur-md px-8 py-4 flex items-center gap-3 hover:border-emerald-400 transition"

              >

                <Play size={18} />

                Explore

              </button>

            </div>

            {/* Floating Stats */}

            <div className="grid grid-cols-3 gap-5 mt-16">

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10">

                <h2 className="text-4xl font-black text-emerald-400">

                  1000+

                </h2>

                <p className="text-gray-300 mt-2">

                  Active Golfers

                </p>

              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10">

                <h2 className="text-4xl font-black text-emerald-400">

                  ₹50K+

                </h2>

                <p className="text-gray-300 mt-2">

                  Rewards Won

                </p>

              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/10">

                <h2 className="text-4xl font-black text-emerald-400">

                  120+

                </h2>

                <p className="text-gray-300 mt-2">

                  Charity Partners

                </p>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="relative flex justify-center">

            <div className="absolute w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[180px] opacity-25"/>

            <img

              src={heroImage}

              alt="Hero"

              className="relative z-20 w-full max-w-lg drop-shadow-[0_0_80px_rgba(16,185,129,0.45)]"

            />

          </div>

        </div>

      </section>

      {/* ===== PART 2 STARTS FROM HERE ===== */}
            {/* ================= TRUST METRICS ================= */}

      <section className="relative z-20 py-24">

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 items-stretch">

            {trustMetrics.map(({ icon: Icon, value, label }) => (

              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center flex flex-col justify-between transition duration-300 hover:-translate-y-2 hover:border-emerald-400/50 hover:bg-white/10"
              >

                <div className="flex justify-center mb-5">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">

                    <Icon size={30} />

                  </div>

                </div>

                <h3 className="text-4xl font-black text-emerald-400">

                  {value}

                </h3>

                <p className="mt-3 text-gray-300">

                  {label}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ================= FEATURES ================= */}

      <section
        id="features"
        className="relative z-20 py-28"
      >

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-3xl mx-auto">

            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300">

              PLATFORM FEATURES

            </span>

            <h2 className="mt-6 text-5xl font-black leading-tight">

              Everything You Need To

              <span className="text-emerald-400">

                {" "}Improve & Earn

              </span>

            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">

              Powerful tools designed to help golfers improve their
              performance while earning rewards and supporting
              meaningful causes.

            </p>

          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

            {features.map(({ icon: Icon, title, copy }) => (

              <article
                key={title}
                className="group rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-3 hover:border-emerald-400/50 hover:shadow-[0_0_45px_rgba(16,185,129,0.18)]"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 transition-all duration-300 group-hover:scale-110">

                  <Icon size={32} />

                </div>

                <h3 className="mt-8 text-2xl font-bold">

                  {title}

                </h3>

                <p className="mt-5 leading-8 text-gray-300">

                  {copy}

                </p>

                <button
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 transition hover:gap-4"
                >

                  Learn More

                  <ArrowRight size={18} />

                </button>

              </article>

            ))}

          </div>

        </div>

      </section>

      {/* ================= WHY FAIRWAY IMPACT ================= */}

      <section className="relative z-20 py-28">

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>

              <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300">

                WHY FAIRWAY IMPACT

              </span>

              <h2 className="mt-6 text-5xl font-black leading-tight">

                Every Round Makes

                <span className="text-emerald-400">

                  {" "}A Difference

                </span>

              </h2>

              <p className="mt-8 text-lg leading-8 text-gray-300">

                Fairway Impact combines golf performance,
                exciting monthly rewards,
                advanced analytics,
                and transparent charitable giving
                into one premium experience.

              </p>

              <div className="mt-12 space-y-6">

                {[
                  "Track every score with detailed analytics",
                  "Earn monthly lucky draw entries",
                  "Support verified charities automatically",
                  "Compete with golfers across the community"
                ].map((item) => (

                  <div
                    key={item}
                    className="flex items-center gap-4"
                  >

                    <div className="h-3 w-3 rounded-full bg-emerald-400"/>

                    <span className="text-lg">

                      {item}

                    </span>

                  </div>

                ))}

              </div>

            </div>

            <div className="relative">

              <div className="absolute inset-0 rounded-[40px] bg-gradient-to-r from-emerald-500/30 to-green-400/20 blur-3xl"/>

              <div className="relative rounded-[40px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">

                <div className="grid grid-cols-2 gap-6">

                  <div className="rounded-3xl bg-[#0d2017] p-8">

                    <h3 className="text-4xl font-black text-emerald-400">

                      98%

                    </h3>

                    <p className="mt-3 text-gray-300">

                      User Satisfaction

                    </p>

                  </div>

                  <div className="rounded-3xl bg-[#0d2017] p-8">

                    <h3 className="text-4xl font-black text-emerald-400">

                      24/7

                    </h3>

                    <p className="mt-3 text-gray-300">

                      Performance Tracking

                    </p>

                  </div>

                  <div className="rounded-3xl bg-[#0d2017] p-8">

                    <h3 className="text-4xl font-black text-emerald-400">

                      Monthly

                    </h3>

                    <p className="mt-3 text-gray-300">

                      Reward Draws

                    </p>

                  </div>

                  <div className="rounded-3xl bg-[#0d2017] p-8">

                    <h3 className="text-4xl font-black text-emerald-400">

                      100%

                    </h3>

                    <p className="mt-3 text-gray-300">

                      Transparent Giving

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
            {/* ================= IMPACT SECTION ================= */}

      <section
        id="impact"
        className="relative z-20 py-28"
      >
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-3xl mx-auto">

            <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-400/20 px-5 py-2 text-sm text-emerald-300">

              SOCIAL IMPACT

            </span>

            <h2 className="mt-6 text-5xl font-black">

              Golf That

              <span className="text-emerald-400">

                {" "}Changes Lives

              </span>

            </h2>

            <p className="mt-6 text-lg text-gray-300 leading-8">

              Every subscription contributes towards verified
              charities while rewarding your dedication to golf.

            </p>

          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-20">

            {impactStats.map((item) => (

              <div
                key={item.title}
                className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:border-emerald-400/40 transition"
              >

                <h3 className="text-3xl font-black text-emerald-400">

                  {item.title}

                </h3>

                <p className="mt-4 text-gray-300 leading-7">

                  {item.description}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section
        id="how-it-works"
        className="relative z-20 py-28"
      >

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center">

            <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-sm text-emerald-300">

              HOW IT WORKS

            </span>

            <h2 className="mt-6 text-5xl font-black">

              Simple Steps To

              <span className="text-emerald-400">

                {" "}Success

              </span>

            </h2>

          </div>

          <div className="mt-24 grid lg:grid-cols-4 md:grid-cols-2 gap-8">

            {howItWorks.map((step) => (

              <div
                key={step.title}
                className="relative rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:-translate-y-3 transition duration-300"
              >

                <div className="absolute -top-6 left-8 h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-xl font-black">

                  {step.step}

                </div>

                <div className="pt-10">

                  <h3 className="text-2xl font-bold">

                    {step.title}

                  </h3>

                  <p className="mt-5 text-gray-300 leading-8">

                    {step.description}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ================= PRICING ================= */}

      <section
        id="plans"
        className="relative z-20 py-28"
      >

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center">

            <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-sm text-emerald-300">

              SUBSCRIPTIONS

            </span>

            <h2 className="mt-6 text-5xl font-black">

              Choose Your

              <span className="text-emerald-400">

                {" "}Membership

              </span>

            </h2>

          </div>

          <div className="grid lg:grid-cols-3 gap-10 mt-20">

            {signupPlans.map((plan, index) => (

              <div
                key={plan.code}
                className={`rounded-[35px] border p-10 backdrop-blur-xl transition duration-300 hover:-translate-y-3
                ${
                  index === 1
                    ? "border-emerald-400 bg-emerald-500/10 scale-105"
                    : "border-white/10 bg-white/5"
                }`}
              >

                {index === 1 && (

                  <span className="inline-block rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold">

                    MOST POPULAR

                  </span>

                )}

                <h3 className="mt-6 text-3xl font-bold">

                  {plan.name}

                </h3>

                <div className="mt-6 text-5xl font-black text-emerald-400">

                  {plan.price}

                </div>

                <p className="mt-5 text-gray-300 leading-8">

                  {plan.note}

                </p>

                <button

                  onClick={() => navigate("/signup")}

                  className="mt-10 w-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 py-4 font-bold hover:scale-105 transition"

                >

                  Get Started

                </button>

              </div>

            ))}

          </div>

        </div>

      </section>
            {/* ================= FINAL CTA ================= */}

      <section className="relative z-20 py-32">

        <div className="max-w-7xl mx-auto px-6">

          <div className="relative overflow-hidden rounded-[40px] border border-emerald-500/20 bg-gradient-to-r from-[#0E2A1E] via-[#103321] to-[#0E2A1E] p-16">

            <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[180px]" />

            <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-green-400/20 blur-[180px]" />

            <div className="relative z-10 text-center">

              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">

                START TODAY

              </span>

              <h2 className="mt-8 text-5xl lg:text-6xl font-black leading-tight">

                Ready To Make

                <span className="text-emerald-400">

                  {" "}Every Round Count?

                </span>

              </h2>

              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-gray-300">

                Join thousands of golfers improving their performance,
                winning monthly rewards,
                and creating real-world impact through every game.

              </p>

              <div className="mt-12 flex flex-wrap justify-center gap-6">

                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-10 py-5 text-lg font-bold shadow-2xl transition hover:scale-105"
                >

                  Start Free Today

                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full border border-white/20 bg-white/5 px-10 py-5 text-lg backdrop-blur-xl transition hover:border-emerald-400"
                >

                  Login

                </button>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="relative z-20 border-t border-white/10 bg-[#07120D]">

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="grid gap-12 lg:grid-cols-4">

            <div>

              <h2 className="text-3xl font-black">

                FAIRWAY

                <span className="text-emerald-400">

                  {" "}IMPACT

                </span>

              </h2>

              <p className="mt-6 leading-8 text-gray-400">

                Track your golf performance,
                earn monthly rewards,
                and support meaningful charities
                with every round you play.

              </p>

            </div>

            <div>

              <h3 className="text-lg font-bold">

                Platform

              </h3>

              <ul className="mt-6 space-y-4 text-gray-400">

                <li>

                  <a href="#features" className="hover:text-emerald-400">

                    Features

                  </a>

                </li>

                <li>

                  <a href="#how-it-works" className="hover:text-emerald-400">

                    How It Works

                  </a>

                </li>

                <li>

                  <Link to="/prize-pool" className="hover:text-emerald-400">

                    Rewards

                  </Link>

                </li>

                <li>

                  <Link to="/charity" className="hover:text-emerald-400">

                    Charity

                  </Link>

                </li>

              </ul>

            </div>

            <div>

              <h3 className="text-lg font-bold">

                Company

              </h3>

              <ul className="mt-6 space-y-4 text-gray-400">

                <li>About Us</li>

                <li>Support</li>

                <li>Contact</li>

                <li>Privacy Policy</li>

              </ul>

            </div>

            <div>

              <h3 className="text-lg font-bold">

                Get Started

              </h3>

              <p className="mt-6 text-gray-400">

                Join Fairway Impact today and
                transform every golf round
                into rewards and social impact.

              </p>

              <button
                onClick={() => navigate("/signup")}
                className="mt-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-8 py-3 font-bold transition hover:scale-105"
              >

                Create Account

              </button>

            </div>

          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-gray-500 md:flex-row">

            <p>

              © 2026 Fairway Impact. All Rights Reserved.

            </p>

            <div className="flex gap-8">

              <a href="#" className="hover:text-emerald-400">

                Terms

              </a>

              <a href="#" className="hover:text-emerald-400">

                Privacy

              </a>

              <a href="#" className="hover:text-emerald-400">

                Cookies

              </a>

            </div>

          </div>

        </div>

      </footer>

    </div>

  );

}