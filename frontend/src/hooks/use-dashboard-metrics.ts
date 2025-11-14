"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { fetchDashboardMetrics } from "@/lib/api"
import type { DashboardMetrics } from "@/lib/api"

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetrics | null>(null)
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
      const metrics = await fetchDashboardMetrics()
      if (mounted.current) {
        setData(metrics)
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Unable to load metrics.")
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
