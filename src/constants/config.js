// Business Logic & Configuration Constants
// Source of truth for prices, percentages, and business rules

// ============================================
// SUBSCRIPTION PLANS
// ============================================
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    code: 'monthly',
    name: 'Popular',
    price: 12,
    displayPrice: '$12 ',
    note: 'Flexible access with impact tracking',
    yearlySavings: null
  },
  YEARLY: {
    code: 'yearly',
    name: 'Premium',
    price: 124,
    displayPrice: '$124 ',
    note: 'Best value with savings and steady giving',
    yearlySavings: '18%'
  }
};

// ============================================
// REVENUE SPLIT PERCENTAGES
// ============================================
export const REVENUE_SPLIT = {
  CHARITY: 0.10,        // 10% to selected charity per user requirement
  PLATFORM: 0.80,       // 80% to platform operations
  OTHER_CAUSES: 0.10    // 10% to other causes
};

// ============================================
// MONTHLY CONTRIBUTION CALCULATION
// ============================================
export const calculateMonthlyContribution = (planCode) => {
  const plan = SUBSCRIPTION_PLANS[planCode === 'yearly' ? 'YEARLY' : 'MONTHLY'];
  if (!plan) return 0;
  
  const monthlyPrice = planCode === 'yearly' ? plan.price / 12 : plan.price;
  return parseFloat((monthlyPrice * REVENUE_SPLIT.CHARITY).toFixed(2));
};

// ============================================
// PRIZE POOL DISTRIBUTION
// ============================================
export const PRIZE_POOL_RULES = [
  { matchType: '5-Number Match', share: '40%', rollover: 'Yes (Jackpot)' },
  { matchType: '4-Number Match', share: '35%', rollover: 'No' },
  { matchType: '3-Number Match', share: '25%', rollover: 'No' }
];

// ============================================
// CHARITY ORGANIZATIONS (FALLBACK)
// ============================================
export const DEFAULT_CHARITIES = [
  {
    id: 'youth',
    name: 'First Tee Futures',
    focus: 'Youth coaching and community access',
    impact: '$148,200 deployed',  // Will be overridden by API
    mood: 'Rising access for first-generation players'
  },
  {
    id: 'water',
    name: 'Clean Water Forward',
    focus: 'Safe water infrastructure projects',
    impact: '$92,300 deployed',   // Will be overridden by API
    mood: 'Steady utility funding with measurable reach'
  },
  {
    id: 'mental-health',
    name: 'Open Fairways Trust',
    focus: 'Mental wellbeing and recovery support',
    impact: '$64,900 deployed',   // Will be overridden by API
    mood: 'Support for resilience and recovery'
  }
];

// ============================================
// API ENDPOINTS
// ============================================
export const API_ENDPOINTS = {
  AUTH: ' api/v1/auth',
  BILLING: ' api/v1/billing',
  DASHBOARD: ' api/v1/dashboard',
  STATIC: ' api/v1/static',
  ANALYTICS: ' api/v1/score-analytics',
  ASSISTANT: ' api/v1/assistant'
};

// ============================================
// DEFAULT USER STATE
// ============================================
export const DEFAULT_USER_STATE = {
  firstName: 'Player',
  greeting: 'Progress with pressure. Giving with presence.'
};

// ============================================
// VALIDATION RULES
// ============================================
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_MIN_LENGTH: 6,
  CONTRIBUTION_MIN: 10,
  CONTRIBUTION_MAX: 50,
  OTP_LENGTH: 6,
  OTP_TTL_MINUTES: 5
};

// ============================================
// ROUTES
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  DRAWS: '/dashboard/draws',
  REWARDS: '/dashboard/rewards',
  PERFORMANCE: '/dashboard/performance',
  AI_INSIGHTS: '/dashboard/ai-insights',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRIZE_POOL: '/admin/prize-pool'
};
