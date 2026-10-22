export interface ValidationResult {
  shouldEscalate: boolean;
  escalationCount: number;
}

const TRIGGER_WORDS = /\b(ignore|override)\b/i;
const INDIAN_CURRENCY = /₹?\s*(\d[\d,]*)/g;

function extractNumericClaims(text: string): number[] {
  const numbers: number[] = [];
  for (const match of text.matchAll(INDIAN_CURRENCY)) {
    numbers.push(Number(match[1].replace(/,/g, "")));
  }
  const plainNumbers = text.match(/\b(\d{4,})\b/g);
  if (plainNumbers) {
    for (const n of plainNumbers) {
      numbers.push(Number(n));
    }
  }
  return numbers;
}

export function validateUserInput(
  text: string,
  ceiling: number,
  priorEscalationCount: number
): ValidationResult {
  let escalationCount = priorEscalationCount;

  if (TRIGGER_WORDS.test(text)) {
    escalationCount++;
    return { shouldEscalate: escalationCount >= 2, escalationCount };
  }

  const demands = extractNumericClaims(text);
  for (const demand of demands) {
    if (demand > ceiling) {
      escalationCount++;
      return { shouldEscalate: escalationCount >= 2, escalationCount };
    }
  }

  return { shouldEscalate: false, escalationCount };
}