import type { Damage, Policy } from '../types'
import { DEPRECIATION_RATES, METAL_DEPRECIATION_BY_AGE, PART_MATERIALS, SEVERITY_RATIO_THRESHOLDS } from './config'

const LOW_CONFIDENCE_THRESHOLD = 0.6

export function getPartMaterial(part: string): string {
  const lower = part.toLowerCase()
  for (const [key, mat] of Object.entries(PART_MATERIALS)) {
    if (lower.includes(key)) return mat
  }
  return 'metal'
}

export function getDepreciationRate(part: string, vehicleAge: number, zeroDep: boolean): number {
  if (zeroDep) return 0
  const material = getPartMaterial(part)
  const rate = DEPRECIATION_RATES[material]
  if (material === 'metal') {
    for (let age = vehicleAge; age >= 0; age--) {
      if (METAL_DEPRECIATION_BY_AGE[age] !== undefined) return METAL_DEPRECIATION_BY_AGE[age]
    }
  }
  return rate ?? 0.2
}

export function checkPolicy(
  policy: Policy | null,
  regNo: string,
  incidentDate: string
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (!policy) {
    reasons.push('Policy not found')
    return { valid: false, reasons }
  }
  if (policy.regNo.toLowerCase() !== regNo.toLowerCase()) {
    reasons.push('Registration number does not match policy')
  }
  if (policy.coverType !== 'comprehensive') {
    reasons.push('Policy does not include own damage cover')
  }
  const endDate = new Date(policy.endDate)
  const incident = new Date(incidentDate)
  if (incident > endDate) {
    reasons.push('Policy was not active on the incident date')
  }
  if (policy.claimsThisYear >= 2) {
    reasons.push('Maximum claims limit reached for this policy year')
  }
  return { valid: reasons.length === 0, reasons }
}

export function checkEscalationTriggers(
  damages: Damage[],
  files: { fraudFlag?: string }[]
): string[] {
  const reasons: string[] = []

  for (const d of damages) {
    if (d.confidence < LOW_CONFIDENCE_THRESHOLD) {
      reasons.push(`Low confidence (${(d.confidence * 100).toFixed(0)}%) on ${d.part} ${d.damageType}`)
    }
    if (d.damageRatio > SEVERITY_RATIO_THRESHOLDS.moderate) {
      reasons.push(`Excessive damage (${(d.damageRatio * 100).toFixed(0)}%) on ${d.part}`)
    }
  }

  for (const f of files) {
    if (f.fraudFlag) {
      reasons.push(`Fraud flag detected: ${f.fraudFlag}`)
    }
  }

  return reasons
}

export function getPolicyAgeYears(policy: Policy, incidentDate: string): number {
  const start = new Date(policy.startDate)
  const incident = new Date(incidentDate)
  const years = (incident.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.floor(years))
}

export function roundToNearestHundred(amount: number): number {
  return Math.round(amount / 100) * 100
}