"use client"

import * as React from "react"
import {
  IconBroadcast,
  IconCheck,
  IconCopy,
  IconDeviceImac,
  IconLoader2,
  IconPlugConnected,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react"

import { API_BASE, safeJson } from "@/lib/api"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ApiStation = {
  id: string
  name: string
  api_token: string
  prepared_loyalty_card: string | null
  prepared_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type DeviceStationSelection = {
  id: string
  name: string
  token: string
}

export default function StationsPage() {
  const [stations, setStations] = React.useState<ApiStation[]>([])
  const [stationName, setStationName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [clearingId, setClearingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [activeStation, setActiveStation] = React.useState<DeviceStationSelection | null>(null)

  React.useEffect(() => {
    void fetchStations()
  }, [])

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("loyaltypass.activeStation")
      if (stored) {
        const parsed = JSON.parse(stored) as DeviceStationSelection
        setActiveStation(parsed)
      }
    } catch {
      setActiveStation(null)
    }
  }, [])

  async function fetchStations() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/stations/`, {
        credentials: "include",
      })
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please sign in to view stations.")
      }
      if (!response.ok) {
        throw new Error("Unable to load stations.")
      }
      const payload = await response.json()
      const results: ApiStation[] = Array.isArray(payload) ? payload : payload.results ?? []
      setStations(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach the backend.")
      setStations([])
    } finally {
      setIsLoading(false)
    }
  }

  const preparedCount = stations.filter((station) => Boolean(station.prepared_loyalty_card)).length
  const totalStations = stations.length

  async function handleCreateStation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stationName.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/stations/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: stationName.trim() }),
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error("Please sign in to create stations.")
      }
      if (!response.ok) {
        const detail = await safeJson(response)
        throw new Error(detail?.detail ?? "Failed to create station.")
      }

      setStationName("")
      await fetchStations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create station.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopyToken(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  async function handleClearPrepared(station: ApiStation) {
    if (!station.prepared_loyalty_card) return
    setClearingId(station.id)
    try {
      const params = new URLSearchParams({
        token: station.api_token,
        clear: "true",
      })
      const response = await fetch(
        `${API_BASE}/api/stations/${station.id}/prepared-pass/?${params.toString()}`,
        {
          credentials: "include",
        },
      )
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please sign in to manage station slots.")
      }
      await fetchStations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear prepared card.")
    } finally {
      setClearingId(null)
    }
  }

  async function handleDeleteStation(station: ApiStation) {
    if (!window.confirm(`Delete ${station.name}? This cannot be undone.`)) return
    setDeletingId(station.id)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/stations/${station.id}/`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please sign in to delete stations.")
      }
      if (!response.ok) {
        const detail = await safeJson(response)
        throw new Error(detail?.detail ?? "Failed to delete station.")
      }
      await fetchStations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete station.")
    } finally {
      setDeletingId(null)
    }
  }

  function rememberStation(station: ApiStation) {
    const selection: DeviceStationSelection = {
      id: station.id,
      name: station.name,
      token: station.api_token,
    }
    setActiveStation(selection)
    window.localStorage.setItem("loyaltypass.activeStation", JSON.stringify(selection))
  }

  function clearRememberedStation() {
    setActiveStation(null)
    window.localStorage.removeItem("loyaltypass.activeStation")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <StationsHeader />
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
          <StatsRow total={totalStations} prepared={preparedCount} />
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card className="border-primary/20">
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Device Station</CardTitle>
                <CardDescription>
                  Select which station this device represents. All loyalty card issuance and checkout
                  actions will use its token automatically.
                </CardDescription>
              </div>
              {activeStation ? (
                <div className="flex flex-col items-start gap-1 text-sm lg:items-end">
                  <span className="font-medium text-primary">{activeStation.name}</span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">{activeStation.token}</code>
                  <Button variant="ghost" size="sm" onClick={clearRememberedStation}>
                    Forget this device
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No station selected for this device yet.
                </span>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create a Station</CardTitle>
              <CardDescription>
                Each physical device needs a Station token. Generate it once and store it on the
                device securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleCreateStation}>
                <Input
                  value={stationName}
                  onChange={(event) => setStationName(event.target.value)}
                  placeholder="e.g. Drive Thru Tablet"
                  aria-label="Station name"
                  className="text-foreground placeholder:text-muted-foreground"
                />
                <Button className="md:min-w-[160px]" disabled={!stationName.trim() || isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create Station"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Stations</CardTitle>
              <CardDescription>
                Copy the Station token to configure a new device or clear the prepared slot if a pass
                was already handed out.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader className="[&_th]:text-black dark:[&_th]:text-white">
                  <TableRow>
                    <TableHead className="min-w-[200px] text-foreground">Station</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="min-w-[200px] text-foreground">Prepared Slot</TableHead>
                    <TableHead className="min-w-[260px] text-foreground">Station Token</TableHead>
                    <TableHead className="min-w-[160px] text-foreground">Last Activity</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <IconLoader2 className="size-4 animate-spin" />
                          Loading stations…
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && stations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No stations yet. Create one above to get started.
                      </TableCell>
                    </TableRow>
                  )}
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={station.prepared_loyalty_card ? "secondary" : "outline"}
                          className={cn(
                            station.prepared_loyalty_card
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : "text-muted-foreground",
                          )}
                        >
                          {station.prepared_loyalty_card ? "Card Ready" : "Idle"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {station.prepared_loyalty_card ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Token {truncateToken(station.prepared_loyalty_card)}
                            </span>
                            <span className="text-xs text-muted-foreground">Waiting on NFC tap</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Empty</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {station.api_token}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopyToken(station.api_token, station.id)}
                            aria-label="Copy station token"
                          >
                            {copiedId === station.id ? (
                              <IconCheck className="size-4 text-primary" />
                            ) : (
                              <IconCopy className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDateTime(station.updated_at || station.prepared_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={activeStation?.id === station.id ? "default" : "secondary"}
                            size="sm"
                            onClick={() => rememberStation(station)}
                          >
                            {activeStation?.id === station.id ? "Using on this device" : "Use here"}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleClearPrepared(station)}
                            disabled={!station.prepared_loyalty_card || clearingId === station.id}
                          >
                            {clearingId === station.id ? "Clearing…" : "Clear Slot"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStation(station)}
                            disabled={deletingId === station.id}
                          >
                            <IconTrash className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function StationsHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b px-4 lg:px-6">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Stations</h1>
            <p className="text-sm text-muted-foreground">
              Manage device tokens and prepared passes for each checkout station.
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline">
              <IconShieldCheck className="mr-2 size-4" />
              Deployment Guide
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatsRow({ total, prepared }: { total: number; prepared: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={<IconDeviceImac className="size-5 text-primary" />}
        label="Total Stations"
        value={total}
        description="Devices linked to this business"
      />
      <MetricCard
        icon={<IconPlugConnected className="size-5 text-primary" />}
        label="Prepared Slots"
        value={prepared}
        description="Stations ready to hand out passes"
      />
      <MetricCard
        icon={<IconBroadcast className="size-5 text-primary" />}
        label="Idle"
        value={Math.max(total - prepared, 0)}
        description="Stations awaiting the next customer"
      />
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode
  label: string
  value: number
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-3xl font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function truncateToken(token: string) {
  if (token.length <= 8) return token
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}
