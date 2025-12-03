"use client"

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000"

export type BusinessSummary = {
  id: string | null
  name: string | null
}

export type CurrentUser = {
  id: string
  username: string
  name: string
  email: string
  business: BusinessSummary
  avatar?: string | null
}

export type CustomerSummary = {
  id: string
  name: string
  phone_number?: string | null
}

export type BusinessCustomerSummary = {
  id: string
  business: BusinessSummary | null
  customer: CustomerSummary
}

export type LoyaltyCardDetails = {
  token: string
  points_balance: number
  business_customer: BusinessCustomerSummary
}

export type TransactionRecord = {
  id: string
  amount: number
  final_amount: number
  points_earned: number
  points_redeemed: number
  created_at: string
  station?: {
    id: string
    name: string
  } | null
  loyalty_card?: LoyaltyCardDetails | null
}

export type BusinessCustomerRecord = {
  id: string
  customer: CustomerSummary
}

export type LoyaltyCardIssueResult = {
  customer: CustomerSummary
  business_customer_id: string
  loyalty_card: {
    token: string
    points_balance: number
    qr_payload?: string
    authentication_token?: string | null
  }
  prepared_pass_url: string
  wallet?: {
    apple?: { download_url: string }
    google?: { download_url: string }
  }
}

export type DashboardMetrics = {
  active_loyalty_cards: number
  active_loyalty_cards_prev: number
  repeat_customers: number
  repeat_customers_prev: number
  points_redeemed_7d: number
  points_redeemed_prev: number
  wallet_pass_installs: number
  wallet_pass_prev: number
}

export type StationReadiness = {
  id: string
  name: string
  status: "online" | "offline"
  prepared_slot?: {
    customer: string
    token: string
  } | null
  updated: string | null
}

export type RevenueTrendPoint = {
  date: string
  total: number
}

export type RecentTransaction = {
  id: string
  customer: string
  station: string
  amount: number
  points_earned: number
  points_redeemed: number
  created_at: string
}

export type TopCustomer = {
  name: string
  visits: number
  points: number
}

export type DashboardDetails = {
  station_readiness: StationReadiness[]
  revenue_trend: RevenueTrendPoint[]
  recent_transactions: RecentTransaction[]
  top_customers: TopCustomer[]
}

export async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function loginRequest(credentials: { username: string; password: string }) {
  const response = await fetch(`${API_BASE}/accounts/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to sign in.")
  }
  return data as CurrentUser
}

export async function logoutRequest() {
  const response = await fetch(`${API_BASE}/accounts/logout/`, {
    method: "POST",
    credentials: "include",
  })
  if (!response.ok && response.status !== 401) {
    const data = await safeJson(response)
    throw new Error(data?.detail ?? "Unable to log out.")
  }
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(`${API_BASE}/accounts/me/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    return null
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to load profile.")
  }
  return data as CurrentUser
}

export async function updatePassword(payload: { current_password: string; new_password: string }) {
  const response = await fetch(`${API_BASE}/accounts/password/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to update password.")
  }
  return data as { detail?: string }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch(`${API_BASE}/api/dashboard-metrics/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to view metrics.")
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to load metrics.")
  }
  return data as DashboardMetrics
}

export async function fetchDashboardDetails(): Promise<DashboardDetails> {
  const response = await fetch(`${API_BASE}/api/dashboard-data/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to view dashboard data.")
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to load dashboard data.")
  }
  return data as DashboardDetails
}

export async function fetchBusinessCustomers(): Promise<BusinessCustomerRecord[]> {
  const response = await fetch(`${API_BASE}/api/businesscustomers/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to view loyalty customers.")
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to load loyalty customers.")
  }
  const list = Array.isArray(data) ? data : data?.results
  if (!Array.isArray(list)) {
    return []
  }
  return list.map((item: any) => {
    const fallbackId = item.customer?.id ?? item.id ?? `${Date.now()}-${Math.random()}`
    return {
      id: String(item.id ?? fallbackId),
      customer: {
        id: String(item.customer?.id ?? fallbackId),
        name: item.customer?.name ?? "Unknown customer",
        phone_number: item.customer?.phone_number ?? null,
      },
    }
  })
}

export async function issueLoyaltyCard(
  payload: { customer_name: string; phone_number: string },
  stationToken: string,
): Promise<LoyaltyCardIssueResult> {
  if (!stationToken) {
    throw new Error("Station token is required before issuing a loyalty card.")
  }
  const response = await fetch(`${API_BASE}/api/loyaltycards/issue/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Station-Token": stationToken,
    },
    body: JSON.stringify(payload),
  })
  const data = await safeJson(response)
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in and ensure your station token is valid.")
  }
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to issue loyalty card.")
  }
  return data as LoyaltyCardIssueResult
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function normalizeTransaction(record: any): TransactionRecord {
  return {
    id: String(record.id),
    amount: normalizeNumber(record.amount),
    final_amount: normalizeNumber(record.final_amount ?? record.amount),
    points_earned: Number(record.points_earned ?? 0),
    points_redeemed: Number(record.points_redeemed ?? 0),
    created_at: String(record.created_at ?? new Date().toISOString()),
    station: record.station
      ? { id: String(record.station.id), name: record.station.name ?? "Station" }
      : null,
    loyalty_card: record.loyalty_card ?? null,
  }
}

export async function fetchTransactions(): Promise<TransactionRecord[]> {
  const response = await fetch(`${API_BASE}/api/transactions/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to view transactions.")
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to load transactions.")
  }
  const results = Array.isArray(data) ? data : data?.results
  if (!Array.isArray(results)) {
    return []
  }
  return results.map((item) => normalizeTransaction(item))
}

export async function fetchLoyaltyCard(token: string): Promise<LoyaltyCardDetails> {
  const response = await fetch(`${API_BASE}/api/loyaltycards/${token}/`, {
    credentials: "include",
  })
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to lookup loyalty cards.")
  }
  const data = await safeJson(response)
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to find that loyalty card.")
  }
  return data as LoyaltyCardDetails
}

type CreateTransactionPayload = {
  loyalty_card_id?: string | null
  amount: number
  redeem?: boolean
}

export async function createTransaction(
  payload: CreateTransactionPayload,
  stationToken: string,
): Promise<TransactionRecord> {
  const body: Record<string, unknown> = {
    amount: payload.amount,
    redeem: Boolean(payload.redeem),
  }
  if (payload.loyalty_card_id) {
    body.loyalty_card_id = payload.loyalty_card_id
  }
  const response = await fetch(`${API_BASE}/api/transactions/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Station-Token": stationToken,
    },
    body: JSON.stringify(body),
  })
  const data = await safeJson(response)
  if (response.status === 401 || response.status === 403) {
    throw new Error("Please sign in to record transactions.")
  }
  if (!response.ok) {
    throw new Error(data?.detail ?? "Unable to create transaction.")
  }
  return normalizeTransaction(data)
}
