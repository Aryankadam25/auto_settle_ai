const CURRENCY_PATTERN = /₹\s*[\d,]+/g;

function safeTemplate(approvedAmount: number): string {
  return `We can settle at ₹${approvedAmount.toLocaleString("en-IN")}.`;
}

export function verifyAssistantMessage(
  message: string,
  approvedAmount: number
): string {
  const matches = message.match(CURRENCY_PATTERN);
  if (!matches) return message;

  const expected = `₹${approvedAmount.toLocaleString("en-IN")}`;

  for (const match of matches) {
    if (match !== expected) {
      return safeTemplate(approvedAmount);
    }
  }

  return message;
}