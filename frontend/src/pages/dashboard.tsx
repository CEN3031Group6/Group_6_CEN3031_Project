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

  const cardClass =
    theme === "dark"
      ? "bg-black border border-blue-300 rounded-lg text-white shadow-lg shadow-black/30"
      : "bg-white border border-zinc-200 rounded-2xl text-black shadow-sm"

  const headerLabelClass =
    theme === "dark"
      ? "text-xs font-medium uppercase tracking-wide text-blue-300"
      : "text-xs font-medium uppercase tracking-wide text-zinc-400"

  const primaryButtonClass =
    theme === "dark"
      ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-md"
      : "bg-white hover:bg-zinc-100 text-black border border-zinc-300 rounded-md"

  const outlineButtonClass =
    theme === "dark"
      ? "border border-blue-400 text-blue-300 hover:bg-blue-900/20 rounded-md"
      : "bg-white text-black border border-zinc-300 hover:bg-zinc-100 rounded-md"

  const defaultButtonClass =
    theme === "dark"
      ? "bg-zinc-800 hover:bg-zinc-700 text-white rounded-md"
      : "bg-white text-black border border-zinc-300 hover:bg-zinc-100 rounded-md"

  const inputClass =
    theme === "dark"
      ? "bg-black border border-blue-400 focus-visible:ring-blue-500 text-white placeholder:text-gray-400 rounded-md"
      : "bg-white border border-zinc-300 focus-visible:ring-zinc-500 text-black placeholder:text-zinc-400 rounded-md"

  const titleTextClass = theme === "dark" ? "text-sky-50" : "text-black"
  const mutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"

  const footerClass =
    theme === "dark"
      ? "mt-auto w-full bg-black text-white border-t border-blue-900/50"
      : "mt-auto w-full bg-white text-black border-t border-zinc-200"

  const kpiBadgeClass =
    theme === "dark"
      ? "bg-slate-900/80 text-blue-200 border border-blue-400"
      : "bg-zinc-100 text-zinc-700 border border-zinc-300"

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
          <header className={`rounded-2xl px-6 py-5 ${cardClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={headerLabelClass}>OVERVIEW · WEEK OF NOV 10</p>
                <h1 className={`text-2xl font-semibold tracking-tight ${titleTextClass}`}>
                  {user?.business.name ?? "Loyalty Dashboard"}
                </h1>
                <p className={`text-sm ${mutedTextClass}`}>
                  Track cards issued, wallet installs, and station readiness in one glance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild className={outlineButtonClass}>
                  <Link href="/CheckoutTransactions">Create transaction</Link>
                </Button>
                <Button variant="secondary" asChild className={primaryButtonClass}>
                  <Link href="/CreateLoyaltyCard">Create Loyalty Card</Link>
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((stat) => (
              <Card key={stat.label} className={`@container/card ${cardClass}`}>
                <CardHeader>
                  <CardDescription className={mutedTextClass}>
                    {stat.label}
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {metricsLoading && !metrics ? "Loading…" : stat.value}
                  </CardTitle>
                  <CardAction>
                    <Badge className={kpiBadgeClass}>
                      {stat.trend === "down" ? (
                        <IconTrendingDown className="mr-1 size-4" />
                      ) : stat.trend === "flat" ? (
                        <IconMinus className="mr-1 size-4" />
                      ) : (
                        <IconTrendingUp className="mr-1 size-4" />
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
                  <div className={mutedTextClass}>{stat.caption}</div>
                </CardFooter>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className={`lg:col-span-2 ${cardClass}`}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Revenue trends</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Total revenue for the selected window.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueTrend && revenueTrend.length > 0 ? (
                  <div
                    className={
                      theme === "dark"
                        ? "rounded-xl bg-black text-white"
                        : "rounded-xl bg-white text-black"
                    }
                  >
                    <ChartAreaInteractive data={revenueTrend} />
                  </div>
                ) : (
                  <div className={`flex h-40 items-center justify-center text-sm ${mutedTextClass}`}>
                    No revenue recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Station readiness</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Each station&apos;s pass slot and device status.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-transparent [&_th]:text-black dark:[&_th]:text-white">
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
                        <TableCell
                          colSpan={4}
                          className={`text-center text-sm ${mutedTextClass}`}
                        >
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
                          <TableCell className={`text-sm ${mutedTextClass}`}>
                            {station.prepared_slot?.customer ?? "Empty"}
                          </TableCell>
                          <TableCell className={`text-sm ${mutedTextClass}`}>
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
            <Card className={`lg:col-span-2 ${cardClass}`}>
              <CardHeader className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className={titleTextClass}>Recent transactions</CardTitle>
                  <CardDescription className={mutedTextClass}>
                    Latest check-ins and redemptions across stations.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={outlineButtonClass}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-transparent [&_th]:text-black dark:[&_th]:text-white">
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
                        <TableCell
                          colSpan={5}
                          className={`text-center text-sm ${mutedTextClass}`}
                        >
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
                          <TableCell className={mutedTextClass}>
                            {formatRelativeDate(txn.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Top customers</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Based on visits and points banked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCustomers.length === 0 ? (
                  <p className={`text-sm text-center ${mutedTextClass}`}>
                    No customers yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-transparent [&_th]:text-black dark:[&_th]:text-white">
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
                            <Badge variant="outline">
                              {formatPoints(customer.points)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <Separator />
                <Button
                  variant="secondary"
                  className={`w-full ${defaultButtonClass}`}
                >
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
