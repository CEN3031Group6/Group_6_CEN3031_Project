"use client"

import * as React from "react"
import Link from "next/link"

import { DashboardMetrics, useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import { useDashboardDetails } from "@/hooks/use-dashboard-details"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { RecentTransaction, StationReadiness, TopCustomer } from "@/lib/api"
import { formatCurrency, formatNumber, formatPoints } from "@/lib/number"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  IconTrendingDown,
  IconTrendingUp,
  IconMinus,
} from "@tabler/icons-react"

type KPIDefinition = {
  label: string
  key: keyof DashboardMetrics
  prevKey: keyof DashboardMetrics
  caption: string
}

const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    label: "Active Loyalty Cards",
    key: "active_loyalty_cards",
    prevKey: "active_loyalty_cards_prev",
    caption: "Cards in circulation this week",
  },
  {
    label: "Repeat Customers",
    key: "repeat_customers",
    prevKey: "repeat_customers_prev",
    caption: "Members with 2+ visits",
  },
  {
    label: "Points Redeemed (7d)",
    key: "points_redeemed_7d",
    prevKey: "points_redeemed_prev",
    caption: "Redemptions vs prior week",
  },
  {
    label: "Wallet Pass Installs",
    key: "wallet_pass_installs",
    prevKey: "wallet_pass_prev",
    caption: "New installs this month",
  },
]

const FALLBACK_STATIONS: StationReadiness[] = []
const FALLBACK_TRANSACTIONS: RecentTransaction[] = []
const FALLBACK_TOP_CUSTOMERS: TopCustomer[] = []

type ThemeMode = "light" | "dark"

export default function Page() {

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
  const { user } = useCurrentUser()
  const { data: metrics, loading: metricsLoading } = useDashboardMetrics()
  const { data: details, loading: detailsLoading } = useDashboardDetails()
  const dashboardLoading = metricsLoading || detailsLoading

  const stationReadiness = details?.station_readiness ?? FALLBACK_STATIONS

  const revenueTrend = details?.revenue_trend

  const recentTransactions = details?.recent_transactions ?? FALLBACK_TRANSACTIONS
  const topCustomers = details?.top_customers ?? FALLBACK_TOP_CUSTOMERS

  const kpis = React.useMemo(
    () =>
      KPI_DEFINITIONS.map((item) => {
        const current = metrics ? (metrics[item.key] as number | null) ?? null : null
        const prev = metrics ? (metrics[item.prevKey] as number | null) ?? null : null
        const delta = current !== null && prev !== null ? current - prev : null
        const trend =
          delta === null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat"
        return {
          ...item,
          value: formatNumber(current),
          delta,
          trend,
        }
      }),
    [metrics],
  )

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
        <SiteHeader />
        <div
          className={`flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 ${pageBgClass}`}
          aria-busy={dashboardLoading}
        >
          <header className="rounded-2xl border bg-card px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overview • Week of Nov 10</p>
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                  {user?.business.name ?? "Loyalty Dashboard"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track cards issued, wallet installs, and station readiness in one glance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" asChild>
                  <Link href="/CheckoutTransactions">Create transaction</Link>
                </Button>
                <Button>Create Loyalty Card</Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((stat) => (
              <Card key={stat.label} className="@container/card shadow-xs">
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {metricsLoading && !metrics ? (
                      <span className="text-muted-foreground">Loading…</span>
                    ) : (
                      stat.value
                    )}
                  </CardTitle>
                  <CardAction>
                    <Badge
                      variant="outline"
                      className="border-border text-black dark:text-white"
                    >
                      {stat.trend === "down" ? (
                        <IconTrendingDown className="size-4 text-black dark:text-white" />
                      ) : stat.trend === "flat" ? (
                        <IconMinus className="size-4 text-black dark:text-white" />
                      ) : (
                        <IconTrendingUp className="size-4 text-black dark:text-white" />
                      )}
                      {formatDelta(stat.delta)}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {stat.trend === null
                      ? "No change yet"
                      : stat.trend === "up"
                        ? "Trending up"
                        : stat.trend === "down"
                          ? "Needs attention"
                          : "Holding steady"}
                    {stat.trend === "down" ? (
                      <IconTrendingDown className="size-4" />
                    ) : stat.trend === "flat" ? (
                      <IconMinus className="size-4" />
                    ) : (
                      <IconTrendingUp className="size-4" />
                    )}
                  </div>
                  <div className="text-muted-foreground">{stat.caption}</div>
                </CardFooter>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-xs">
              <ChartAreaInteractive data={revenueTrend} />
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Station readiness</CardTitle>
                <CardDescription>Each station’s pass slot and device status.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader className="[&_th]:text-black dark:[&_th]:text-white">
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prepared Slot</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stationReadiness.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No stations yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stationReadiness.map((station) => (
                        <TableRow key={station.id || station.name}>
                          <TableCell className="font-medium">{station.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={station.status === "online" ? "secondary" : "destructive"}
                              className={
                                station.status === "online"
                                  ? "bg-primary/5 text-primary"
                                  : "bg-destructive/10 text-destructive"
                              }
                            >
                              {station.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {station.prepared_slot?.customer ?? "Empty"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeDate(station.updated)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Recent transactions</CardTitle>
                  <CardDescription>Latest check-ins and redemptions across stations.</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader className="[&_th]:text-black dark:[&_th]:text-white">
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className="font-medium">{txn.customer}</TableCell>
                          <TableCell>{txn.station}</TableCell>
                          <TableCell>{formatCurrency(txn.amount)}</TableCell>
                          <TableCell>
                            {txn.points_redeemed > 0
                              ? `Redeemed ${txn.points_redeemed} pts`
                              : `+${txn.points_earned} pts`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatRelativeDate(txn.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Top customers</CardTitle>
                <CardDescription>Based on visits and points banked.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">No customers yet.</p>
                ) : (
                  <Table>
                    <TableHeader className="[&_th]:text-black dark:[&_th]:text-white">
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((customer) => (
                        <TableRow key={customer.name}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.visits}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{formatPoints(customer.points)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <Separator />
                <Button variant="secondary" className="w-full">
                  Export customer list
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        <footer className={footerClass}>
          <div className="w-full px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-8 object-contain mix-blend-darken"
              />
              <span className="font-medium">LoyaltyPass Inc.</span>
            </div>
            <p className={theme === "dark" ? "text-sm text-white/70" : "text-sm text-black/70"}>
              © {new Date().getFullYear()} LoyaltyPass Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function formatDelta(value: number | null) {
  if (value === null) return "—"
  const sign = value >= 0 ? "+" : "-"
  return `${sign}${formatNumber(Math.abs(value))}`
}
