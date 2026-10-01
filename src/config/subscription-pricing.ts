export const SUBSCRIPTION_PRICING = {
  pro: {
    monthly: 49,
    annualMonthlyEquivalent: 39,
    annualTotal: 468,
  },
  business: {
    monthly: 99,
    annualMonthlyEquivalent: 79,
    annualTotal: 948,
  },
} as const;

export const PLAN_MONTHLY_ESTIMATES = {
  free: 0,
  pro: SUBSCRIPTION_PRICING.pro.annualMonthlyEquivalent,
  business: SUBSCRIPTION_PRICING.business.annualMonthlyEquivalent,
} as const;
