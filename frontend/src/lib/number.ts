export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—"
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return `${value.toLocaleString()} pts`
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = "USD",
) {
  if (value === null || value === undefined) return "—"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
