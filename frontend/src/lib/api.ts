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
