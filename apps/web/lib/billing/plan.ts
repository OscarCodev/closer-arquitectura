export type SubscriptionPlan = 'free' | 'pro'

export type BillingStatus = {
  plan: SubscriptionPlan
  periodStart: string
  periodEnd: string
  simulationsUsed: number
  autogenerationsUsed: number
}

export type PlanLimits = {
  sessionMinutes: number
  simulationsPerMonth: number
  autogenerationsPerMonth: number
}

export const SUPPORT_EMAIL = 'info@closerai.lat'

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    sessionMinutes: 10,
    simulationsPerMonth: 20,
    autogenerationsPerMonth: 20,
  },
  pro: {
    sessionMinutes: 10,
    simulationsPerMonth: 100,
    autogenerationsPerMonth: 50,
  },
}

export function normalizePlan(value: unknown): SubscriptionPlan {
  return value === 'pro' ? 'pro' : 'free'
}

export function getPlanLimits(plan: SubscriptionPlan | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan === 'pro' ? 'pro' : 'free']
}

export function createDefaultBillingStatus(plan: SubscriptionPlan = 'free'): BillingStatus {
  const { periodStart, periodEnd } = getCurrentBillingPeriod()
  return {
    plan,
    periodStart,
    periodEnd,
    simulationsUsed: 0,
    autogenerationsUsed: 0,
  }
}

export function getCurrentBillingPeriod(referenceDate = new Date()) {
  const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1))
  const periodEnd = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1))

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }
}

export function isBillingPeriodExpired(periodEnd: string, referenceDate = new Date()) {
  const parsed = new Date(periodEnd)
  if (Number.isNaN(parsed.getTime())) return true
  return parsed.getTime() <= referenceDate.getTime()
}
