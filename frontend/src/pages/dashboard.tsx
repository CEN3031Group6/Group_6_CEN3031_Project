import * as React from "react"
import Link from "next/link"

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
} from "@tabler/icons-react"

const kpis = [
  {
    label: "Active Loyalty Cards",
    value: "1,248",
    change: "+4.2%",
    trend: "up",
    caption: "Cards in circulation this week",
  },
  {
    label: "Repeat Customers",
    value: "682",
    change: "+38",
    trend: "up",
    caption: "Members with 2+ visits",
  },
  {
    label: "Points Redeemed (7d)",
    value: "94,210",
    change: "−8%",
    trend: "down",
    caption: "Redemptions vs prior week",
  },
  {
    label: "Wallet Pass Installs",
    value: "312",
    change: "+67",
    trend: "up",
    caption: "New installs this month",
  },
]

const topCustomers = [
  { name: "Dana Miles", visits: 18, points: 4_820 },
  { name: "Chris Conway", visits: 14, points: 3_260 },
  { name: "Jessie Harper", visits: 12, points: 2_910 },
  { name: "Sam Lee", visits: 10, points: 2_100 },
]

const stationStatuses = [
  { name: "Front Counter", status: "online", prepared: "Dana Miles", updated: "2 min ago" },
  { name: "Drive Thru", status: "online", prepared: null, updated: "18 min ago" },
  { name: "Lobby Kiosk", status: "offline", prepared: null, updated: "Yesterday" },
  { name: "Pop-up Cart", status: "online", prepared: "Chris Conway", updated: "just now" },
]

const transactions = [
  {
    id: "TXN-8934",
    customer: "Dana Miles",
    station: "Front Counter",
    amount: "$18.40",
    points: "+28 pts",
    time: "10:42 AM",
  },
  {
    id: "TXN-8933",
    customer: "Sam Lee",
    station: "Drive Thru",
    amount: "$32.10",
    points: "+48 pts",
    time: "9:58 AM",
  },
  {
    id: "TXN-8932",
    customer: "Chris Conway",
    station: "Pop-up Cart",
    amount: "$12.75",
    points: "Redeemed 100 pts",
    time: "9:15 AM",
  },
  {
    id: "TXN-8931",
    customer: "Jessie Harper",
    station: "Front Counter",
    amount: "$21.60",
    points: "+32 pts",
    time: "Yesterday",
  },
]

export default function Page() {
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
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
          <header className="rounded-2xl border bg-card px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overview • Week of Nov 10</p>
                <h1 className="text-2xl font-semibold tracking-tight">Sunrise Coffee Loyalty</h1>
                <p className="text-sm text-muted-foreground">
                  Track cards issued, wallet installs, and station readiness in one glance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" asChild>
                  <Link href="/transactions/create">Create transaction</Link>
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
                    {stat.value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      {stat.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
                      {stat.change}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {stat.trend === "up" ? "Trending up" : "Needs attention"}
                    {stat.trend === "up" ? (
                      <IconTrendingUp className="size-4" />
                    ) : (
                      <IconTrendingDown className="size-4" />
                    )}
                  </div>
                  <div className="text-muted-foreground">{stat.caption}</div>
                </CardFooter>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Station readiness</CardTitle>
                  <CardDescription>Each station’s pass slot and device status.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-sm">
                  Manage stations
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prepared Slot</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stationStatuses.map((station) => (
                      <TableRow key={station.name}>
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
                          {station.prepared ? station.prepared : "Empty"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{station.updated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="lg:col-span-1">
              <ChartAreaInteractive />
            </div>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.customer}</TableCell>
                        <TableCell>{txn.station}</TableCell>
                        <TableCell>{txn.amount}</TableCell>
                        <TableCell>{txn.points}</TableCell>
                        <TableCell className="text-muted-foreground">{txn.time}</TableCell>
                      </TableRow>
                    ))}
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
                {topCustomers.map((customer) => (
                  <div key={customer.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.visits} visits</p>
                    </div>
                    <Badge variant="outline">{customer.points.toLocaleString()} pts</Badge>
                  </div>
                ))}
                <Separator />
                <Button variant="secondary" className="w-full">
                  Export customer list
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
