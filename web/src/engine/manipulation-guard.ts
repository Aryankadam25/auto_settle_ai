const MANIPULATION_PATTERNS = [
  /\bignore\b/i,
  /\bapprove\b/i,
  /\bsystem\b/i,
  /\boverride\b/i,
  /approve\s+\d[\d,]*/i,
  /pay\s+\d[\d,]*/i,
  /settle\s+\d[\d,]*/i,
  /release\s+\d[\d,]*/i,
]

const AMOUNT_PATTERN = /(?:^|\s)(\d{2,})(?:\s|$|[.,])/

export interface ManipulationCheck {
  detected: boolean
  reason?: string
  extractedAmount?: number
}

export function checkManipulation(message: string): ManipulationCheck {
  const result: ManipulationCheck = { detected: false }

  for (const pattern of MANIPULATION_PATTERNS) {
    if (pattern.test(message)) {
      result.detected = true
      result.reason = `Message contains prohibited pattern: ${pattern.source}`
      break
    }
  }

  const amountMatch = message.match(AMOUNT_PATTERN)
  if (amountMatch) {
    result.extractedAmount = parseInt(amountMatch[1].replace(/,/g, ''), 10)
  }

  return result
}

export function checkManipulationThreshold(attempts: number): boolean {
  return attempts >= 2
}