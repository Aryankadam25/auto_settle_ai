const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** 123456 -> "₹1,23,456" (Indian digit grouping, whole rupees). */
export function formatINR(amount: number): string {
  return inr.format(Math.round(amount))
}

/** 0.876 -> "88%" */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

/** ISO timestamp -> "02:35 pm" (empty string if the value is not a valid date). */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/** ISO timestamp -> "22 Oct 2026, 02:35 pm" (returns the raw value if it is not a valid date). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
