import type { Damage, Estimate, Policy } from '../types'
import { COST_TABLE } from './config'
import { getDepreciationRate, getPolicyAgeYears, roundToNearestHundred } from './policy'

function findCostKey(part: string, damageType: string, severity: string): string {
  const p = part.toLowerCase().trim()
  const d = damageType.toLowerCase().trim()
  const s = severity.toLowerCase().trim()
  const exact = `${p}-${d}-${s}`
  if (COST_TABLE[exact]) return exact
  for (const [key] of Object.entries(COST_TABLE)) {
    const [kp, kd, ks] = key.split('-')
    if ((p.includes(kp) || kp.includes(p)) && (d.includes(kd) || kd.includes(d)) && s.startsWith(ks)) return key
    if ((p.includes(kp) || kp.includes(p)) && s.startsWith(ks) && (d.includes(kd) || kd.includes(d))) return key
  }
  return 'default-dent-moderate'
}

export function calculateEstimate(damages: Damage[], policy: Policy, incidentDate: string): Estimate {
  let totalParts = 0
  let totalLabour = 0
  let totalPaint = 0
  let totalDepreciation = 0
  const vehicleAge = getPolicyAgeYears(policy, incidentDate)

  for (const d of damages) {
    const costKey = findCostKey(d.part, d.damageType, d.severity)
    const costRow = COST_TABLE[costKey]
    if (!costRow) continue

    totalParts += costRow.parts
    totalLabour += costRow.labour
    totalPaint += costRow.paint

    if (costRow.replace && costRow.parts > 0) {
      const rate = getDepreciationRate(d.part, vehicleAge, policy.zeroDep)
      totalDepreciation += roundToNearestHundred(costRow.parts * rate)
    }
  }

  const total = roundToNearestHundred(totalParts + totalLabour + totalPaint - totalDepreciation)
  const depreciation = roundToNearestHundred(totalDepreciation)

  return {
    parts: roundToNearestHundred(totalParts),
    labour: roundToNearestHundred(totalLabour),
    paint: roundToNearestHundred(totalPaint),
    depreciation,
    total,
  }
}