export const DEPRECIATION_RATES: Record<string, number> = {
  plastic: 0.5,
  rubber: 0.5,
  fibreglass: 0.3,
  glass: 0,
  metal: 0,
}

export const METAL_DEPRECIATION_BY_AGE: Record<number, number> = {
  0: 0,
  1: 0.1,
  2: 0.15,
  3: 0.2,
  4: 0.25,
  5: 0.3,
}

export const PART_MATERIALS: Record<string, string> = {
  bumper: 'plastic',
  'front bumper': 'plastic',
  'rear bumper': 'plastic',
  'fender': 'metal',
  'door': 'metal',
  'front door': 'metal',
  'rear door': 'metal',
  hood: 'metal',
  'bonnet': 'metal',
  'trunk': 'metal',
  'windshield': 'glass',
  'windscreen': 'glass',
  'headlamp': 'plastic',
  'taillight': 'plastic',
  mirror: 'plastic',
  'side mirror': 'plastic',
  grille: 'plastic',
  'wheel': 'rubber',
  'tire': 'rubber',
  'rim': 'metal',
  'quarter panel': 'metal',
  'roof': 'metal',
  'rear hatch': 'metal',
}

export const FLOOR_PERCENT = 0.7
export const CEILING_PERCENT = 0.9
export const ROUND_INCREMENT = 500
export const MAX_ROUNDS = 3
export const ESCALATION_COST_THRESHOLD = 50000

export const SEVERITY_RATIO_THRESHOLDS = {
  minor: 0.1,
  moderate: 0.3,
}

export const COST_TABLE: Record<string, Record<string, { parts: number; labour: number; paint: number; replace: boolean }>> = {
  'bumper-scratch-minor': { parts: 0, labour: 1500, paint: 2500, replace: false },
  'bumper-dent-moderate': { parts: 6000, labour: 1500, paint: 2500, replace: true },
  'bumper-dent-severe': { parts: 8000, labour: 2000, paint: 3000, replace: true },
  'door-dent-moderate': { parts: 0, labour: 3000, paint: 3500, replace: false },
  'door-dent-severe': { parts: 9000, labour: 3000, paint: 3500, replace: true },
  'hood-dent-moderate': { parts: 0, labour: 4000, paint: 4000, replace: false },
  'hood-dent-severe': { parts: 14000, labour: 4000, paint: 5000, replace: true },
  'windshield-crack-minor': { parts: 8000, labour: 1500, paint: 0, replace: true },
  'windshield-shatter-severe': { parts: 12000, labour: 2000, paint: 0, replace: true },
  'fender-dent-moderate': { parts: 5000, labour: 2500, paint: 3000, replace: true },
  'headlamp-crack-minor': { parts: 3000, labour: 800, paint: 0, replace: true },
  'taillight-crack-minor': { parts: 2500, labour: 800, paint: 0, replace: true },
  'default-dent-moderate': { parts: 4000, labour: 2000, paint: 2500, replace: true },
}

export const IMAGE_QUALITY_THRESHOLDS = {
  laplacianVariance: 100,
  minBrightness: 50,
}

export const FRAUD_EXIF_SUSPICIOUS_TAGS = ['Adobe Photoshop', 'Lightroom', 'GIMP', 'PhotoScape', 'edited']