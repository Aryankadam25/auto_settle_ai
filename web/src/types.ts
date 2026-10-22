export interface Vehicle {
  make: string
  model: string
  year: number
}

export interface Policy {
  policyNo: string
  regNo: string
  mobile: string
  ownerName: string
  vehicle: Vehicle
  coverType: 'comprehensive' | 'third-party'
  startDate: string
  endDate: string
  idv: number
  zeroDep: boolean
  claimsThisYear: number
}

export type ClaimStatus =
  | 'created'
  | 'verified'
  | 'uploaded'
  | 'assessed'
  | 'negotiating'
  | 'settled'
  | 'escalated'

export interface DamageBox {
  x: number
  y: number
  w: number
  h: number
}

export interface Damage {
  part: string
  damageType: string
  severity: 'minor' | 'moderate' | 'severe'
  confidence: number
  damageRatio: number
  box: DamageBox
  vlmAgrees: boolean
  modelName?: string
  modelVersion?: string
}

export interface Estimate {
  parts: number
  labour: number
  paint: number
  depreciation: number
  total: number
}

export type OfferState = 'offer_made' | 'countered' | 'accepted' | 'escalated'

export interface Offer {
  round: number
  amount: number
  state: OfferState
}

export type Actor =
  | 'Customer'
  | 'AI model'
  | 'Policy engine'
  | 'Verifier'
  | 'Adjuster'
  | 'System'

export interface AuditEntry {
  time: string
  actor: Actor
  action: string
  input: string
  output: string
  rule: string
  confidence?: number
}

export interface UploadedFile {
  id: string
  name: string
  url: string
  qualityPassed: boolean
  qualityMessage?: string
  fraudFlag?: string
}

export interface Claim {
  id: string
  policyNo: string
  status: ClaimStatus
  files: UploadedFile[]
  damages: Damage[]
  estimate?: Estimate
  offers: Offer[]
  escalationReasons: string[]
  createdAt: string
  currentRound: number
  manipulationAttempts: number
  vlmAgrees: boolean
}

export interface ChatMessage {
  id: string
  role: 'customer' | 'assistant'
  text: string
  offer?: Offer
  timestamp: string
}

export interface EscalatedClaim {
  id: string
  policyNo: string
  ownerName: string
  vehicle: Vehicle
  estimate: Estimate
  escalationReasons: string[]
  priority: 'high' | 'medium' | 'low'
  age: string
  status: ClaimStatus
  damages: Damage[]
  files: UploadedFile[]
  auditTrail: AuditEntry[]
  offers: Offer[]
}

export type SeverityLevel = 'minor' | 'moderate' | 'severe'

export const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
}