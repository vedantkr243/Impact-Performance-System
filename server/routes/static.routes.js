const express = require("express");
const dataService = require("../services/data.service");
const asyncHandler = require("../utils/async-handler");
const { optionalAuthenticate } = require("../middleware/optional-auth");

const router = express.Router();

const ok = (data) => ({ success: true, data });

router.use(optionalAuthenticate);

router.get(
  "/home",
  asyncHandler(async (_req, res) => {
    res.json(ok(await dataService.getHomeContent()));
  })
);

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    res.json(ok(await dataService.getDashboardContent(req.user?.sub || req.user?.id)));
  })
);

router.get(
  "/performance",
  asyncHandler(async (req, res) => {
    res.json(ok(await dataService.getPerformanceContent(req.user?.id)));
  })
);

router.get(
  "/draws",
  asyncHandler(async (req, res) => {
    res.json(ok(await dataService.getDrawsContent(req.user?.id)));
  })
);

router.get(
  "/rewards",
  asyncHandler(async (req, res) => {
    res.json(ok(await dataService.getRewardsContent(req.user?.id)));
  })
);

router.get(
  "/ai-insights",
  asyncHandler(async (req, res) => {
    res.json(ok(await dataService.getAiInsightsContent(req.user?.id)));
  })
);

router.get(
  "/signup",
  asyncHandler(async (_req, res) => {
    res.json(ok(await dataService.getSignupContent()));
  })
);

router.get(
  "/signup-plans",
  asyncHandler(async (_req, res) => {
    res.json(ok((await dataService.getSignupPlansContent()) || {}));
  })
);

router.get(
  "/prize-pool",
  asyncHandler(async (_req, res) => {
    res.json(ok(await dataService.getPrizePoolContent()));
  })
);

router.get(
  "/charity",
  asyncHandler(async (_req, res) => {
    res.json(ok((await dataService.getCharityContent()) || {}));
  })
);

router.get(
  "/ui",
  asyncHandler(async (_req, res) => {
    res.json(ok((await dataService.getUiContent()) || {}));
  })
);

router.get(
  "/admin",
  asyncHandler(async (_req, res) => {
    res.json(ok(await dataService.getAdminContent()));
  })
);

module.exports = router;
