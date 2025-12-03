"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import {
  BusinessCustomerRecord,
  LoyaltyCardIssueResult,
  fetchBusinessCustomers,
  issueLoyaltyCard,
} from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STORAGE_KEY = "loyaltypass.activeStation"
const ENV_STATION_TOKEN = process.env.NEXT_PUBLIC_STATION_TOKEN ?? ""
const ENV_STATION_SLUG =
  process.env.NEXT_PUBLIC_PASS_STATION_SLUG ?? process.env.NEXT_PUBLIC_STATION_SLUG ?? undefined
const PASS_BASE_PATH =
  (process.env.NEXT_PUBLIC_PASS_BASE_PATH ?? "/pass").replace(/\/+$/, "") || "/pass"

type DeviceStationSelection = {
  id: string
  name: string
  token: string
  slug?: string
}

export default function LoyaltyCardsPage() {
  const [customers, setCustomers] = React.useState<BusinessCustomerRecord[]>([])
  const [listLoading, setListLoading] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ name: "", phone: "" })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [issuedPass, setIssuedPass] = React.useState<LoyaltyCardIssueResult | null>(null)
  const [station, setStation] = React.useState<DeviceStationSelection | null>(null)

  const stationToken = station?.token ?? ""

  const loadCustomers = React.useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const data = await fetchBusinessCustomers()
      setCustomers(data)
    } catch (err) {
      setCustomers([])
      setListError(err instanceof Error ? err.message : "Unable to load loyalty cards.")
    } finally {
      setListLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setStation(JSON.parse(stored) as DeviceStationSelection)
        return
      }
    } catch {
      // ignore parse errors
    }
    if (ENV_STATION_TOKEN) {
      setStation({
        id: "env-station",
        name: "Env Station Token",
        token: ENV_STATION_TOKEN,
        slug: ENV_STATION_SLUG,
      })
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleIssueCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const customer_name = form.name.trim()
    const phone_number = form.phone.trim()

    if (!customer_name || !phone_number) {
      toast.error("Enter both customer name and phone number.")
      return
    }
    if (!stationToken) {
      toast.error("Select a station token before issuing a card.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await issueLoyaltyCard({ customer_name, phone_number }, stationToken)
      toast.success("Loyalty card issued. Download the pass below.")
      setIssuedPass(result)
      setForm({ name: "", phone: "" })
      await loadCustomers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to issue loyalty card.")
    } finally {
      setIsSubmitting(false)
    }
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
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
          <header className="rounded-2xl border bg-card px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet pass issuance</p>
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                  Loyalty cards
                </h1>
                <p className="text-sm text-muted-foreground">
                  Issue Apple Wallet-ready passes and keep track of customers tied to your business.
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 text-left text-sm lg:items-end">
                <span className="text-muted-foreground">Active station</span>
                {station ? (
                  <>
                    <span className="font-semibold text-black dark:text-white">{station.name}</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {station.token}
                    </code>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-destructive">No station token selected</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/stations">Select station</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Issue a new loyalty card</CardTitle>
                <CardDescription>
                  Customers receive a Wallet-ready pass and can scan the QR right away.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleIssueCard}>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-name">Customer name</Label>
                    <Input
                      id="customer-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      autoComplete="off"
                      className="text-white placeholder:text-white/70"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-phone">Phone number</Label>
                    <Input
                      id="customer-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="5551234567"
                      autoComplete="off"
                      className="text-white placeholder:text-white/70"
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll normalize the number automatically before saving it.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !stationToken}
                  >
                    {isSubmitting ? "Issuing…" : "Issue loyalty card"}
                  </Button>
                </form>
              </CardContent>
              {!stationToken ? (
                <CardFooter className="text-xs text-destructive">
                  Select or create a station token on the Stations page to enable issuance.
                </CardFooter>
              ) : null}
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Latest Wallet pass</CardTitle>
                <CardDescription>
                  Customers download passes from the public NFC link below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {issuedPass ? (
                  <>
                    <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">{issuedPass.customer.name}</p>
                      <p className="text-muted-foreground">
                        Loyalty token:{" "}
                        <span className="font-mono">{issuedPass.loyalty_card.token}</span>
                      </p>
                    </div>
                    {(() => {
                      const stationSlug = station?.slug
                      const downloadLink = stationSlug
                        ? `${PASS_BASE_PATH}/${stationSlug}`
                        : station
                          ? `${PASS_BASE_PATH}?station=${encodeURIComponent(station.token)}`
                          : PASS_BASE_PATH
                      const hasFriendlyLink = Boolean(stationSlug)
                      return (
                        <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Customer download link
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          readOnly
                          value={
                            station
                              ? downloadLink
                              : "Select a station to generate a link"
                          }
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="sm:min-w-[160px]"
                          disabled={!station}
                          onClick={() => {
                            if (!station) return
                            const link = downloadLink
                            navigator.clipboard
                              .writeText(link)
                              .then(() => toast.success("Download link copied."))
                              .catch(() => toast.error("Unable to copy link."))
                          }}
                        >
                          Copy link
                        </Button>
                      </div>
                      <Button asChild variant="secondary" disabled={!station}>
                        {station ? (
                          <Link href={downloadLink} target="_blank" rel="noreferrer">
                            Open customer link
                          </Link>
                        ) : (
                          <span>Link unavailable</span>
                        )}
                      </Button>
                      {!hasFriendlyLink ? (
                        <p className="text-xs text-muted-foreground">
                          Friendly links are available after reselecting this station on the Stations page.
                        </p>
                      ) : null}
                    </div>
                      )
                    })()}
                    <p className="text-xs text-muted-foreground">
                      Tap-to-download happens on the customer&apos;s phone; staff only needs to issue the
                      card here.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Issue a card to stage the Wallet pass, then have the customer tap their station&apos;s NFC link to add it on their device.
                  </p>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Need to prepare cards ahead of time? Keep this page open; the NFC link never changes.
              </CardFooter>
            </Card>
          </div>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Registered loyalty customers</CardTitle>
                  <CardDescription>Syncs with every pass you issue.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadCustomers()}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {listError ? (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {listError}
                </div>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                        Loading loyalty customers…
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                        No loyalty cards issued yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customer.name}</TableCell>
                        <TableCell>
                          {customer.customer.phone_number ? (
                            <Badge variant="outline">{customer.customer.phone_number}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
