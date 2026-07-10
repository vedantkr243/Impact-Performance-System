const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./auth.routes");
const assistantRoutes = require("./assistant.routes");
const billingRoutes = require("./billing.routes");
const scoreAnalyticsRoutes = require("./score-analytics.routes");
const staticRoutes = require("./static.routes");
const dataRoutes = require("./data.routes");
const { notFoundHandler, errorHandler } = require("../middleware/errormiddleware");

const app = express();

app.use(cors());
app.use("/api/v1/billing/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication service is healthy."
  });
});

// 1. How It Works Data
app.get('/api/v1/content/how-it-works', (req, res) => {
  const steps = [
    {
      title: "Enter your scores",
      desc: "Track your real-world performance effortlessly."
    },
    {
      title: "Get AI insights",
      desc: "Understand trends and improve consistency with intelligent feedback."
    },
    {
      title: "Monthly reward system",
      desc: "Your activity gives you a genuine chance to win rewards."
    },
    {
      title: "Support charity",
      desc: "A portion of every participation contributes to real-world impact."
    }
  ];
  res.json(steps);
});

// 2. Features Data
app.get('/api/v1/content/features', (req, res) => {
  const features = [
    {
      title: "AI Insights",
      desc: "Analyze your performance with intelligent, data-driven feedback."
    },
    {
      title: "Probability Engine",
      desc: "Understand your chances with complete transparency."
    },
    {
      title: "Subscription System",
      desc: "Simple and secure participation for all users."
    },
    {
      title: "Social Impact",
      desc: "Track your specific contributions to meaningful charities."
    }
  ];
  res.json(features);
});

// 3. Impact Data
app.get('/api/v1/content/impact', (req, res) => {
  res.json({
    donated: "₹2,50,000",
    activeUsers: "1,200",
    winners: "300",
    message: "Every action contributes to something bigger"
  });
});

// 4. Footer Data
app.get('/api/v1/content/footer', (req, res) => {
  const footerData = {
    mission: "Empowering performance through AI insights and social contribution.",
    contactEmail: "hello@anyhelp.org",
    quickLinks: [
      { text: "About", url: "/about" },
      { text: "Contact", url: "/contact" },
      { text: "Privacy Policy", url: "/privacy" },
      { text: "Terms", url: "/terms" }
    ],
    ctaHeading: "Start your journey today",
    ctaDescription: "Join our global community of change-makers today."
  };
  res.json(footerData);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/assistant", assistantRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/score-analytics", scoreAnalyticsRoutes);
app.use("/api/v1/static", staticRoutes);
app.use("/api/v1/data", dataRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
