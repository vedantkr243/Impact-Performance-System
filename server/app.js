const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");

const authRoutes = require("./routes/auth.routes");
const assistantRoutes = require("./routes/assistant.routes");
const billingRoutes = require("./routes/billing.routes");
const charityRoutes = require("./routes/charity.routes");
const scoreAnalyticsRoutes = require("./routes/score-analytics.routes");
const scoreRoutes = require("./routes/score.routes");
const staticRoutes = require("./routes/static.routes");
const dataRoutes = require("./routes/data.routes");
const drawRoutes = require("./routes/draw.routes");
const debugRoutes = require("./routes/debug.routes");
const drawsRoutes = require("./routes/draws.routes");
const { notFoundHandler, errorHandler } = require("./middleware/errormiddleware");

const app = express();

app.use(cors());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));
app.use("/api/v1/billing/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication service is healthy."
  });
});


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/assistant", assistantRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/charity", charityRoutes);
app.use("/api/v1/score-analytics", scoreAnalyticsRoutes);
app.use("/api/v1/scores", scoreRoutes);
app.use("/api/v1/static", staticRoutes);
app.use("/api/v1/data", dataRoutes);
app.use("/api/v1/draw", drawRoutes);
app.use("/api/v1/debug", debugRoutes);
app.use("/api/v1/draws", drawsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
