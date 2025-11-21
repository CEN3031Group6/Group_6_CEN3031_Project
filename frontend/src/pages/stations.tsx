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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

type ThemeMode = "light" | "dark"

export default function StationsPage() {
  const [theme, setTheme] = React.useState<ThemeMode>("light")

  React.useEffect(() => {
    if (typeof document === "undefined") return

    const root = document.documentElement
    const getThemeFromDom = (): ThemeMode =>
      root.dataset.theme === "dark" ? "dark" : "light"

    setTheme(getThemeFromDom())

    const observer = new MutationObserver(() => {
      setTheme(getThemeFromDom())
    })

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })

    return () => observer.disconnect()
  }, [])

  const pageBgClass =
    theme === "dark"
      ? "bg-gradient-to-b from-[#010B1A] via-[#000814] to-black text-white"
      : "bg-white text-black"

  const footerClass =
    theme === "dark"
      ? "mt-auto w-full bg-black text-white border-t border-blue-900/50"
      : "mt-auto w-full bg-white text-black border-t border-zinc-200"

  const cardBaseClass =
    theme === "dark"
      ? "bg-black border border-blue-300 rounded-lg text-white shadow-lg shadow-black/30"
      : "bg-white border border-zinc-200 rounded-2xl text-black shadow-sm"

  const inputClass =
    theme === "dark"
      ? "bg-black border border-blue-400 focus-visible:ring-blue-500 text-white placeholder:text-gray-400 rounded-md"
      : "bg-white border border-zinc-300 text-black placeholder:text-zinc-400 focus-visible:ring-zinc-500 rounded-md"

  const tableCellTextClass = theme === "dark" ? "text-white" : "text-black"
  const tableMutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"

  const primaryButtonClass =
    theme === "dark"
      ? "bg-[#0A4CFF] hover:bg-[#0840D6] text-white border border-[#0A4CFF] rounded-md"
      : "bg-white hover:bg-zinc-100 text-black border border-zinc-300 rounded-md"

  const outlineButtonClass =
    theme === "dark"
      ? "border border-blue-400 text-blue-300 hover:bg-blue-900/20 rounded-md"
      : "bg-white text-black border border-zinc-300 hover:bg-zinc-100 rounded-md"

  const defaultButtonClass =
    theme === "dark"
      ? "bg-zinc-800 hover:bg-zinc-700 text-white rounded-md"
      : "bg-white text-black border border-zinc-300 hover:bg-zinc-100 rounded-md"

  const mutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"

  const [stations, setStations] = React.useState<ApiStation[]>([])
  const [stationName, setStationName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [clearingId, setClearingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [activeStation, setActiveStation] =
    React.useState<DeviceStationSelection | null>(null)

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
      const results: ApiStation[] = Array.isArray(payload)
        ? payload
        : payload.results ?? []
      setStations(results)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reach the backend.",
      )
      setStations([])
    } finally {
      setIsLoading(false)
    }
  }

  const preparedCount = stations.filter((s) =>
    Boolean(s.prepared_loyalty_card),
  ).length
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
      setError(
        err instanceof Error ? err.message : "Failed to clear prepared card.",
      )
    } finally {
      setClearingId(null)
    }
  }

  async function handleDeleteStation(station: ApiStation) {
    if (!window.confirm(`Delete ${station.name}? This cannot be undone.`))
      return
    setDeletingId(station.id)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE}/api/stations/${station.id}/`,
        {
          method: "DELETE",
          credentials: "include",
        },
      )
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please sign in to delete stations.")
      }
      if (!response.ok) {
        const detail = await safeJson(response)
        throw new Error(detail?.detail ?? "Failed to delete station.")
      }
      await fetchStations()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete station.",
      )
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
    window.localStorage.setItem(
      "loyaltypass.activeStation",
      JSON.stringify(selection),
    )
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
        <StationsHeader theme={theme} />
        <div
          className={cn(
            "flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8",
            pageBgClass,
          )}
        >
          <StatsRow total={totalStations} prepared={preparedCount} theme={theme} />

          {error && (
            <div
              className={
                theme === "dark"
                  ? "rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  : "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              }
            >
              {error}
            </div>
          )}

          <Card className={cardBaseClass}>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Device Station</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Select which station this device represents. All loyalty card
                  issuance and checkout actions will use its token
                  automatically.
                </CardDescription>
              </div>
              {activeStation ? (
                <div className="flex flex-col items-start gap-1 text-sm lg:items-end">
                  <span className="font-medium text-blue-600 dark:text-blue-300">
                    {activeStation.name}
                  </span>
                  <code className="rounded bg-zinc-100 text-zinc-800 dark:bg-slate-900 dark:text-slate-100 px-2 py-1 text-xs">
                    {activeStation.token}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRememberedStation}
                    className={outlineButtonClass}
                  >
                    Forget this device
                  </Button>
                </div>
              ) : (
                <span className={cn("text-sm", mutedTextClass)}>
                  No station selected for this device yet.
                </span>
              )}
            </CardHeader>
          </Card>

          <Card className={cardBaseClass}>
            <CardHeader>
              <CardTitle>Create a Station</CardTitle>
              <CardDescription className={mutedTextClass}>
                Each physical device needs a Station token. Generate it once and
                store it on the device securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3 md:flex-row"
                onSubmit={handleCreateStation}
              >
                <Input
                  value={stationName}
                  onChange={(event) => setStationName(event.target.value)}
                  placeholder="e.g. Drive Thru Tablet"
                  aria-label="Station name"
                  className={inputClass}
                />
                <Button
                  className={cn("md:min-w-[160px]", primaryButtonClass)}
                  disabled={!stationName.trim() || isSubmitting}
                >
                  {isSubmitting ? "Creating…" : "Create Station"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className={cardBaseClass}>
            <CardHeader>
              <CardTitle>Registered Stations</CardTitle>
              <CardDescription className={mutedTextClass}>
                Copy the Station token to configure a new device or clear the
                prepared slot if a pass was already handed out.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent [&_th]:text-black dark:[&_th]:text-white">
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prepared Slot</TableHead>
                    <TableHead>Station Token</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className={cn("text-center text-sm", tableMutedTextClass)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <IconLoader2 className="size-4 animate-spin" />
                          Loading stations…
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && stations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className={cn("text-center text-sm", tableMutedTextClass)}
                      >
                        No stations yet. Create one above to get started.
                      </TableCell>
                    </TableRow>
                  )}
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className={tableCellTextClass}>
                        {station.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            station.prepared_loyalty_card
                              ? "secondary"
                              : "outline"
                          }
                          className={cn(
                            station.prepared_loyalty_card
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : "text-zinc-600 dark:text-slate-300 border-zinc-300 dark:border-slate-600",
                          )}
                        >
                          {station.prepared_loyalty_card ? "Card Ready" : "Idle"}
                        </Badge>
                      </TableCell>
                      <TableCell className={tableCellTextClass}>
                        {station.prepared_loyalty_card ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Token {station.prepared_loyalty_card}
                            </span>
                            <span className={cn("text-xs", tableMutedTextClass)}>
                              Waiting on NFC tap
                            </span>
                          </div>
                        ) : (
                          <span className={tableMutedTextClass}>Empty</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code
                            className={cn(
                              "rounded px-2 py-1 text-xs",
                              theme === "dark"
                                ? "bg-slate-900 text-slate-100 border border-slate-700"
                                : "bg-zinc-100 text-zinc-800 border border-zinc-200",
                            )}
                          >
                            {station.api_token}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleCopyToken(station.api_token, station.id)
                            }
                            aria-label="Copy station token"
                          >
                            {copiedId === station.id ? (
                              <IconCheck className="size-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <IconCopy className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn("font-medium", tableCellTextClass)}
                      >
                        {station.updated_at || station.prepared_at || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={
                              activeStation?.id === station.id
                                ? "default"
                                : "secondary"
                            }
                            size="sm"
                            onClick={() => rememberStation(station)}
                            className={primaryButtonClass}
                          >
                            {activeStation?.id === station.id
                              ? "Using on this device"
                              : "Use here"}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleClearPrepared(station)}
                            disabled={
                              !station.prepared_loyalty_card ||
                              clearingId === station.id
                            }
                            className={outlineButtonClass}
                          >
                            {clearingId === station.id ? "Clearing…" : "Clear Slot"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStation(station)}
                            disabled={deletingId === station.id}
                            className={defaultButtonClass}
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

        <footer className={footerClass}>
          <div className="w-full px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className={
                  theme === "dark"
                    ? "size-8 object-contain"
                    : "size-8 object-contain mix-blend-darken"
                }
              />
              <span className="font-medium">LoyaltyPass Inc.</span>
            </div>
            <p
              className={
                theme === "dark"
                  ? "text-sm text-white/70"
                  : "text-sm text-black/70"
              }
            >
              © {new Date().getFullYear()} LoyaltyPass Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

function StationsHeader({ theme }: { theme: ThemeMode }) {
  const headerClass =
    theme === "dark"
      ? "bg-black text-white border-b border-blue-900/50"
      : "bg-white text-black border-b border-zinc-200"

  const deployButtonClass =
    theme === "dark"
      ? "border border-blue-500 !text-white hover:bg-blue-500/10"
      : "bg-white text-black border border-zinc-300 hover:bg-zinc-100"

  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center px-4 lg:px-6",
        headerClass,
      )}
    >
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Stations</h1>
            <p
              className={
                theme === "dark"
                  ? "text-sm text-slate-300"
                  : "text-sm text-zinc-600"
              }
            >
              Manage device tokens and prepared passes for each checkout
              station.
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" className={deployButtonClass}>
              <IconShieldCheck className="mr-2 size-4" />
              Deployment Guide
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatsRow({
  total,
  prepared,
  theme,
}: {
  total: number
  prepared: number
  theme: ThemeMode
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={<IconDeviceImac className="size-5" />}
        label="Total Stations"
        value={total}
        description="Devices linked to this business"
        theme={theme}
      />
      <MetricCard
        icon={<IconPlugConnected className="size-5" />}
        label="Prepared Slots"
        value={prepared}
        description="Stations ready to hand out passes"
        theme={theme}
      />
      <MetricCard
        icon={<IconBroadcast className="size-5" />}
        label="Idle"
        value={Math.max(total - prepared, 0)}
        description="Stations awaiting the next customer"
        theme={theme}
      />
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  description,
  theme,
}: {
  icon: React.ReactNode
  label: string
  value: number
  description: string
  theme: ThemeMode
}) {
  const cardIconWrapper =
    theme === "dark"
      ? "rounded-full bg-slate-900 p-3 text-blue-300"
      : "rounded-full bg-blue-50 p-3 text-blue-600"

  const mutedText =
    theme === "dark" ? "text-slate-300" : "text-zinc-600"

  return (
    <Card
      className={
        theme === "dark"
          ? "bg-black border border-blue-300 rounded-lg text-white shadow-lg shadow-black/30"
          : "bg-white border border-zinc-200 rounded-2xl text-black shadow-sm"
      }
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cardIconWrapper}>{icon}</div>
        <div className="flex flex-col">
          <span className={cn("text-sm", mutedText)}>{label}</span>
          <span className="text-3xl font-semibold">{value}</span>
          <span className={cn("text-xs", mutedText)}>{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}
