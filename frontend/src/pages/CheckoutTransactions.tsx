"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { toast } from "sonner"

import {
  createTransaction,
  fetchLoyaltyCard,
  fetchTransactions,
  type LoyaltyCardDetails,
  type TransactionRecord,
} from "@/lib/api"
import { formatCurrency, formatPoints } from "@/lib/number"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
const DEFAULT_SCANNER_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
}

type DeviceStationSelection = {
  id: string
  name: string
  token: string
  slug?: string
}

// QR Scanner (no SSR)
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false },
)

export default function CheckoutTransactionsPage() {
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>([])
  const [transactionsLoading, setTransactionsLoading] = React.useState(true)
  const [transactionsError, setTransactionsError] = React.useState<string | null>(null)

  const [isScannerOpen, setIsScannerOpen] = React.useState(false)
  const [preparingScanner, setPreparingScanner] = React.useState(false)
  const [lastScannedCode, setLastScannedCode] = React.useState<string | null>(null)
  const [linkedCard, setLinkedCard] = React.useState<LoyaltyCardDetails | null>(null)
  const [cardLookupLoading, setCardLookupLoading] = React.useState(false)
  const [loyaltyTokenInput, setLoyaltyTokenInput] = React.useState("")

  const [amount, setAmount] = React.useState("")
  const [redeemReward, setRedeemReward] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [station, setStation] = React.useState<DeviceStationSelection | null>(null)
  const [scannerConstraints, setScannerConstraints] = React.useState<MediaTrackConstraints>(DEFAULT_SCANNER_CONSTRAINTS)
  const scannerFallbackRef = React.useRef(false)

  const loadTransactions = React.useCallback(async () => {
    setTransactionsLoading(true)
    setTransactionsError(null)
    try {
      const data = await fetchTransactions()
      setTransactions(data)
    } catch (err) {
      setTransactions([])
      setTransactionsError(err instanceof Error ? err.message : "Unable to load transactions.")
    } finally {
      setTransactionsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setStation(JSON.parse(stored) as DeviceStationSelection)
      }
    } catch {
      setStation(null)
    }
  }, [])

  React.useEffect(() => {
    if (!linkedCard) {
      setRedeemReward(false)
    }
  }, [linkedCard])

  const amountValue = React.useMemo(() => {
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0
    }
    return parsed
  }, [amount])

  const processedTotal = React.useMemo(
    () => transactions.reduce((sum, tx) => sum + (tx.final_amount ?? 0), 0),
    [transactions],
  )

  const customerName = linkedCard?.business_customer.customer.name ?? "—"
  const loyaltyToken = linkedCard?.token ?? lastScannedCode ?? "—"

  async function lookupCard(token: string) {
    const normalized = token.trim()
    if (!normalized) {
      toast.error("Enter a loyalty card token or scan a QR code.")
      return
    }
    setCardLookupLoading(true)
    try {
      const data = await fetchLoyaltyCard(normalized)
      setLinkedCard(data)
      setLastScannedCode(data.token)
      setLoyaltyTokenInput(data.token)
      toast.success(`Linked ${data.business_customer.customer.name}`)
    } catch (err) {
      setLinkedCard(null)
      toast.error(err instanceof Error ? err.message : "Unable to link that loyalty card.")
    } finally {
      setCardLookupLoading(false)
    }
  }

  function handleScanResult(result: string) {
    if (!result) return
    setIsScannerOpen(false)
    void lookupCard(result)
  }

  async function handleManualLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await lookupCard(loyaltyTokenInput)
  }

  function handleRedeemToggle() {
    if (!linkedCard) {
      toast.error("Link a loyalty pass before redeeming a reward.")
      return
    }
    setRedeemReward((prev) => !prev)
  }

  async function handleCompleteTransaction() {
    if (!station) {
      toast.error("Select a device station first (Stations tab).")
      return
    }
    if (!amountValue) {
      toast.error("Enter a purchase amount greater than zero.")
      return
    }

    if (redeemReward && !linkedCard) {
      toast.error("Cannot redeem rewards without a linked loyalty pass.")
      return
    }

    const loyaltyCardId = linkedCard?.token ?? null
    setIsSubmitting(true)
    try {
      const transaction = await createTransaction(
        {
          loyalty_card_id: loyaltyCardId ?? undefined,
          amount: Number(amountValue.toFixed(2)),
          redeem: redeemReward,
        },
        station.token,
      )

      setTransactions((prev) => [transaction, ...prev])
      setAmount("")
      setRedeemReward(false)
      toast.success("Transaction recorded.")

      if (transaction.loyalty_card) {
        setLinkedCard(transaction.loyalty_card)
        setLastScannedCode(transaction.loyalty_card.token)
        setLoyaltyTokenInput(transaction.loyalty_card.token)
      } else if (loyaltyCardId) {
        setLinkedCard(null)
        setLastScannedCode(null)
        setLoyaltyTokenInput("")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to record that transaction.")
    } finally {
      setIsSubmitting(false)
      void loadTransactions()
    }
  }

  const handleOpenScanner = React.useCallback(async () => {
    if (!station) {
      toast.error("Select a device station first (Stations tab).")
      return
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera access is not supported in this browser.")
      return
    }
    setPreparingScanner(true)
    try {
      const provisionalStream = await navigator.mediaDevices.getUserMedia({
        video: DEFAULT_SCANNER_CONSTRAINTS,
      })
      const [track] = provisionalStream.getVideoTracks()
      const settings = track?.getSettings()
      const deviceId = settings?.deviceId
      provisionalStream.getTracks().forEach((t) => t.stop())

      if (deviceId) {
        setScannerConstraints({
          ...DEFAULT_SCANNER_CONSTRAINTS,
          deviceId: { exact: deviceId },
        })
      } else {
        setScannerConstraints(DEFAULT_SCANNER_CONSTRAINTS)
      }

      setIsScannerOpen(true)
    } catch (err) {
      console.error(err)
      toast.error("Unable to access the camera. Check browser permissions and try again.")
    } finally {
      setPreparingScanner(false)
    }
  }, [station])

  React.useEffect(() => {
    if (!isScannerOpen) {
      scannerFallbackRef.current = false
      setScannerConstraints(DEFAULT_SCANNER_CONSTRAINTS)
    }
  }, [isScannerOpen])

  const handleScannerError = React.useCallback(
    (err: unknown) => {
      console.error(err)
      const errorName = err instanceof Error ? err.name : ""
      const needsFallback =
        !scannerFallbackRef.current &&
        (errorName === "OverconstrainedError" || errorName === "NotReadableError" || errorName === "NotAllowedError")

      if (needsFallback) {
        scannerFallbackRef.current = true
        setScannerConstraints({
          ...DEFAULT_SCANNER_CONSTRAINTS,
          facingMode: { ideal: "user" },
        })
        toast.info("Camera fallback activated. Using the front camera instead.")
      } else {
        toast.error("Unable to access the camera. Check Safari permissions and retry.")
      }
    },
    [],
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
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
          <header className="rounded-2xl border bg-card px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checkout &amp; loyalty</p>
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                  Transactions
                </h1>
                <p className="text-sm text-muted-foreground">
                  Scan a wallet pass, optionally redeem a reward, and record the purchase with your station token.
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 text-left text-sm lg:items-end">
                <span className="text-muted-foreground">Active station</span>
                {station ? (
                  <>
                    <span className="text-base font-semibold text-black dark:text-white">{station.name}</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{station.token}</code>
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-destructive">
                    No station selected. Configure one on the Stations page.
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>QR &amp; reward actions</CardTitle>
                <CardDescription>Scan a loyalty pass or toggle a reward before checkout.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-muted-foreground">
                  {lastScannedCode ? (
                    <p>
                      Linked pass token:
                      <span className="ml-1 font-mono text-foreground">{lastScannedCode}</span>
                    </p>
                  ) : (
                    <p>No pass scanned yet.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void handleOpenScanner()} disabled={!station || preparingScanner}>
                    {station ? (preparingScanner ? "Starting camera…" : "Scan QR code") : "Select station first"}
                  </Button>
                  <Button
                    type="button"
                    variant={redeemReward ? "default" : "outline"}
                    onClick={handleRedeemToggle}
                    disabled={!linkedCard}
                  >
                    {redeemReward ? "Reward applied" : "Redeem reward"}
                  </Button>
                </div>
              </CardContent>
              {!station && (
                <CardFooter className="justify-between text-sm text-muted-foreground">
                  <span>Need a station token?</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/stations">Go to Stations</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Linked loyalty pass</CardTitle>
                <CardDescription>Scan the wallet QR or paste the pass token below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkedCard ? (
                  <div className="rounded-lg border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{customerName}</p>
                    <p className="text-xs text-muted-foreground">Token: {loyaltyToken}</p>
                    <p className="text-sm font-medium text-foreground">Balance: {formatPoints(linkedCard.points_balance)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No loyalty pass linked yet. Use the scanner or paste a token to load one.
                  </p>
                )}
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleManualLookup}>
                  <Input
                    value={loyaltyTokenInput}
                    onChange={(event) => setLoyaltyTokenInput(event.target.value)}
                    placeholder="Paste loyalty token"
                    aria-label="Loyalty card token"
                  />
                  <Button type="submit" disabled={cardLookupLoading || !loyaltyTokenInput.trim()}>
                    {cardLookupLoading ? "Linking…" : "Link card"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Transaction amount</CardTitle>
                <CardDescription>Enter the purchase total before rewards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="text-sm font-medium text-foreground" htmlFor="transaction-amount">
                  Amount (USD)
                </label>
                <Input
                  id="transaction-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleCompleteTransaction}
                  disabled={isSubmitting || !station}
                >
                  {isSubmitting ? "Recording…" : "Complete transaction"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Receipt preview</CardTitle>
                <CardDescription>Final totals are confirmed by the backend after submission.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Sub-total</TableCell>
                      <TableCell className="text-right">{formatCurrency(amountValue || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Reward</TableCell>
                      <TableCell className="text-right">
                        {redeemReward ? "Applied at checkout" : formatCurrency(0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Estimated total</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(amountValue || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              {linkedCard && (
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span>Current balance</span>
                  <span className="font-semibold text-foreground">{formatPoints(linkedCard.points_balance)}</span>
                </CardFooter>
              )}
            </Card>
          </div>

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Includes the latest activity for this business.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {transactionsError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {transactionsError}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Loading transactions…
                      </TableCell>
                    </TableRow>
                  )}
                  {!transactionsLoading && transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {transactions.map((tx) => {
                    const customerName =
                      tx.loyalty_card?.business_customer.customer.name ?? "Guest checkout"
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}…</TableCell>
                        <TableCell>{customerName}</TableCell>
                        <TableCell>{formatCurrency(tx.final_amount)}</TableCell>
                        <TableCell>
                          +{formatPoints(tx.points_earned)} / -{formatPoints(tx.points_redeemed)}
                        </TableCell>
                        <TableCell>{tx.station?.name ?? "—"}</TableCell>
                        <TableCell>{formatDateTime(tx.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-between text-sm text-muted-foreground">
              <span>Total processed</span>
              <span className="font-semibold text-foreground">{formatCurrency(processedTotal)}</span>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scan loyalty QR</h2>
              <Button size="sm" variant="outline" onClick={() => setIsScannerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="aspect-square w-full overflow-hidden rounded-lg border">
              <QrScanner
                onScan={(detected) => {
                  const first = Array.isArray(detected) ? detected[0] : detected
                  const value =
                    typeof first === "string"
                      ? first
                      : typeof first?.rawValue === "string"
                        ? first.rawValue
                        : null
                  if (value) {
                    handleScanResult(value)
                    setIsScannerOpen(false)
                  }
                }}
                onError={handleScannerError}
                constraints={scannerConstraints}
                styles={{
                  container: { width: "100%", height: "100%", borderRadius: "0.75rem", overflow: "hidden" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}
