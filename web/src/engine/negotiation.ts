import { formatINR } from '../lib/format'
import type { Claim, Estimate, Offer } from '../types'

/**
 * Money rules for negotiation. "AI perceives and talks. Code decides the money."
 * The backend enforces the same numbers; this file is the client-side guard that
 * refuses to display any offer that breaks them.
 */
export const NEGOTIATION_RULES = {
  /** Each counter-offer round raises our offer by exactly this many rupees. */
  BUMP_PER_ROUND: 500,
  /** Offer rounds available (the opening offer is round 1). A counter after the last round escalates. */
  MAX_ROUNDS: 3,
  /** Pressure / prompt-injection attempts tolerated before the claim is escalated. */
  MAX_MANIPULATION_ATTEMPTS: 2,
} as const

/** The most we can ever offer: the engine's estimate, capped at the policy IDV. */
export function offerCeiling(estimate: Estimate | undefined, idv?: number): number {
  if (!estimate) return 0
  return idv !== undefined && idv > 0 ? Math.min(estimate.total, idv) : estimate.total
}

/** Next offer after a counter: previous + ₹500, never above the ceiling. */
export function nextOfferAmount(previous: number, ceiling: number): number {
  return Math.min(previous + NEGOTIATION_RULES.BUMP_PER_ROUND, ceiling)
}

export function latestOffer(offers: Offer[]): Offer | undefined {
  return offers[offers.length - 1]
}

export interface OfferCheck {
  ok: boolean
  problems: string[]
}

/**
 * Validates a whole offer history. A response that fails this is rejected, not shown.
 * Rules: whole-rupee amounts, never above the ceiling, consecutive rounds starting at 1,
 * at most MAX_ROUNDS, and every new round is exactly +₹500 (or up to the ceiling).
 * Two entries with the same round are a state change (e.g. offer_made -> accepted) and
 * must carry the same amount.
 */
export function validateOfferHistory(offers: Offer[], ceiling: number): OfferCheck {
  const problems: string[] = []

  offers.forEach((offer, i) => {
    if (!Number.isInteger(offer.amount) || offer.amount <= 0) {
      problems.push(`Round ${offer.round}: the amount must be a positive whole-rupee value.`)
    } else if (offer.amount > ceiling) {
      problems.push(
        `Round ${offer.round}: ${formatINR(offer.amount)} is above the approved ceiling of ${formatINR(ceiling)}.`,
      )
    }

    if (offer.round > NEGOTIATION_RULES.MAX_ROUNDS) {
      problems.push(`Round ${offer.round} is beyond the ${NEGOTIATION_RULES.MAX_ROUNDS}-round limit.`)
    }

    if (i === 0) {
      if (offer.round !== 1) problems.push('The first offer must be round 1.')
      return
    }

    const prev = offers[i - 1]

    if (offer.round === prev.round) {
      if (offer.amount !== prev.amount) {
        problems.push(`Round ${offer.round}: the amount changed without a new round.`)
      }
      return
    }

    if (offer.round !== prev.round + 1) {
      problems.push(`Rounds must be consecutive (round ${prev.round} was followed by round ${offer.round}).`)
      return
    }

    if (prev.amount >= ceiling) {
      problems.push(`Round ${offer.round}: there was no headroom left, so this claim should have been escalated.`)
      return
    }

    const expected = nextOfferAmount(prev.amount, ceiling)
    if (offer.amount !== expected) {
      problems.push(
        `Round ${offer.round}: expected ${formatINR(expected)} (previous offer + ${formatINR(
          NEGOTIATION_RULES.BUMP_PER_ROUND,
        )}), got ${formatINR(offer.amount)}.`,
      )
    }
  })

  return { ok: problems.length === 0, problems }
}

export interface CounterAvailability {
  allowed: boolean
  /** Why a counter is not possible (safe to show to the customer). */
  reason?: string
  /** What the next offer would be. For tests and logs only; never shown to the customer. */
  nextAmount?: number
}

/** Can the customer still ask for a higher offer? */
export function counterAvailability(claim: Claim | null, idv?: number): CounterAvailability {
  if (!claim || !claim.estimate) return { allowed: false, reason: 'There is no estimate for this claim yet.' }

  const latest = latestOffer(claim.offers)
  if (!latest) return { allowed: false, reason: 'There is no offer to negotiate yet.' }

  if (claim.status === 'settled' || latest.state === 'accepted') {
    return { allowed: false, reason: 'This offer has already been accepted.' }
  }
  if (claim.status === 'escalated' || latest.state === 'escalated') {
    return { allowed: false, reason: 'This claim is with an adjuster.' }
  }
  if (claim.manipulationAttempts >= NEGOTIATION_RULES.MAX_MANIPULATION_ATTEMPTS) {
    return { allowed: false, reason: 'This claim needs an adjuster to continue.' }
  }
  if (latest.round >= NEGOTIATION_RULES.MAX_ROUNDS) {
    return { allowed: false, reason: 'This is our final offer. You can accept it or ask for an adjuster.' }
  }

  const ceiling = offerCeiling(claim.estimate, idv)
  if (latest.amount >= ceiling) {
    return { allowed: false, reason: 'This is our best offer. You can accept it or ask for an adjuster.' }
  }

  return { allowed: true, nextAmount: nextOfferAmount(latest.amount, ceiling) }
}
