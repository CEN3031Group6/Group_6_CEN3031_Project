"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DashboardDetails, fetchDashboardDetails } from "@/lib/api"

export function useDashboardDetails() {
  const [data, setData] = useState<DashboardDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const details = await fetchDashboardDetails()
      if (mounted.current) {
        setData(details)
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard data.")
        setData(null)
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
