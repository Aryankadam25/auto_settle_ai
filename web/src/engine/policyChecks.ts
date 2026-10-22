import { formatINR } from '../lib/format'
import type { Estimate, Policy } from '../types'

/** Business thresholds. Assumptions: change here and in the backend together. */
export const POLICY_RULES = {
  /** Repair cost above this share of IDV is treated as a possible total loss. */
  TOTAL_LOSS_IDV_RATIO: 0.75,
  /** This many claims in the policy year (or more) sends the claim to an adjuster. */
  MAX_CLAIMS_BEFORE_REVIEW: 3,
  /** Allowed rounding difference (in rupees) when re-adding the estimate. */
  RECONCILE_TOLERANCE: 1,
} as const

export interface PolicyCheck {
  /** Hard stops: the claim cannot proceed automatically at all. */
  blockers: string[]
  /** Soft stops: automatic settlement is not allowed, an adjuster must review. */
  reviewReasons: string[]
  /** True only when there are no blockers and no review reasons. */
  canProceed: boolean
}

function parseDate(value: string, endOfDay: boolean): Date | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const parsed = dateOnly ? new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`) : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Strict policy gate. With only a policy it checks eligibility; with an estimate as well it
 * also checks the money (IDV limit, zero-dep consistency, and that the total adds up).
 */
export function checkPolicy(policy: Policy | null, estimate?: Estimate, today: Date = new Date()): PolicyCheck {
  const blockers: string[] = []
  const reviewReasons: string[] = []

  if (!policy) {
    blockers.push('No verified policy is attached to this claim.')
    return { blockers, reviewReasons, canProceed: false }
  }

  const start = parseDate(policy.startDate, false)
  const end = parseDate(policy.endDate, true)
  if (!start || !end) {
    blockers.push('The policy dates could not be read.')
  } else if (today < start) {
    blockers.push('This policy has not started yet.')
  } else if (today > end) {
    blockers.push('This policy has expired.')
  }

  if (policy.coverType !== 'comprehensive') {
    blockers.push('Damage to your own vehicle is not covered under a third-party policy.')
  }

  if (policy.claimsThisYear >= POLICY_RULES.MAX_CLAIMS_BEFORE_REVIEW) {
    reviewReasons.push(`${policy.claimsThisYear} claims already this policy year.`)
  }

  if (estimate) {
    const recomputed = estimate.parts + estimate.labour + estimate.paint - estimate.depreciation
    if (Math.abs(recomputed - estimate.total) > POLICY_RULES.RECONCILE_TOLERANCE) {
      reviewReasons.push('The estimate does not add up (parts + labour + paint - depreciation).')
    }

    if (policy.zeroDep && estimate.depreciation > 0) {
      reviewReasons.push('Depreciation was applied even though the policy has zero-depreciation cover.')
    }

    if (policy.idv > 0 && estimate.total > policy.idv * POLICY_RULES.TOTAL_LOSS_IDV_RATIO) {
      reviewReasons.push(
        `Estimate of ${formatINR(estimate.total)} is above ${Math.round(
          POLICY_RULES.TOTAL_LOSS_IDV_RATIO * 100,
        )}% of the insured value (${formatINR(policy.idv)}): possible total loss.`,
      )
    }
  }

  return { blockers, reviewReasons, canProceed: blockers.length === 0 && reviewReasons.length === 0 }
}
