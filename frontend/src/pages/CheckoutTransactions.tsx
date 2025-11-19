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
}

type ThemeMode = "light" | "dark"

// QR Scanner (no SSR)
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false },
)

export default function CheckoutTransactionsPage() {
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
      : "bg-black hover:bg-zinc-900 text-white rounded-md"

  const outlineButtonClass =
    theme === "dark"
      ? "border border-blue-400 text-blue-300 hover:bg-blue-900/20 rounded-md"
      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded-md"

  const inputClass =
    theme === "dark"
      ? "bg-black border border-blue-400 focus-visible:ring-blue-500 text-white placeholder:text-gray-400 rounded-md"
      : "bg-white border border-zinc-300 focus-visible:ring-zinc-500 text-black placeholder:text-zinc-400 rounded-md"

  const titleTextClass = theme === "dark" ? "text-sky-50" : "text-black"
  const mutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"
  const subtleAccentTextClass = theme === "dark" ? "text-cyan-200" : "text-black"
  const tableHeaderTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"
  const tableRowHoverClass = theme === "dark" ? "hover:bg-slate-900/60" : "hover:bg-zinc-50"
  const codeClass =
    theme === "dark"
      ? "rounded bg-slate-900/70 px-2 py-1 text-xs text-cyan-300 border border-cyan-500/30"
      : "rounded bg-zinc-100 px-2 py-1 text-xs text-black border border-zinc-300"

  const footerClass =
    theme === "dark"
      ? "mt-auto w-full bg-black text-white border-t border-blue-900/50"
      : "mt-auto w-full bg-white text-black border-t border-zinc-200"

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
        <div
          className={`flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 ${pageBgClass}`}
        >
          <header className={`rounded-2xl px-6 py-5 ${cardClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={headerLabelClass}>Checkout &amp; loyalty</p>
                <h1 className={`mt-1 text-2xl font-semibold tracking-tight ${titleTextClass}`}>
                  Transactions
                </h1>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Scan a wallet pass, optionally redeem a reward, and record the purchase with your station token.
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 text-left text-sm lg:items-end">
                <span className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>
                  Active station
                </span>
                {station ? (
                  <>
                    <span className={`text-base font-semibold ${titleTextClass}`}>{station.name}</span>
                    <code className={codeClass}>
                      {station.token}
                    </code>
                  </>
                ) : (
                  <span className={`flex items-center gap-2 ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`}>
                    No station selected. Configure one on the Stations page.
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>QR &amp; reward actions</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Scan a loyalty pass or toggle a reward before checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className={`text-sm ${mutedTextClass}`}>
                  {lastScannedCode ? (
                    <p>
                      Linked pass token:
                      <span className={`ml-1 font-mono ${theme === "dark" ? "text-cyan-300" : "text-blue-700"}`}>
                        {lastScannedCode}
                      </span>
                    </p>
                  ) : (
                    <p>No pass scanned yet.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void handleOpenScanner()}
                    disabled={!station || preparingScanner}
                    className={primaryButtonClass}
                  >
                    {station ? (preparingScanner ? "Starting camera…" : "Scan QR code") : "Select station first"}
                  </Button>
                  <Button
                    type="button"
                    variant={redeemReward ? "default" : "outline"}
                    onClick={handleRedeemToggle}
                    disabled={!linkedCard}
                    className={redeemReward ? primaryButtonClass : outlineButtonClass}
                  >
                    {redeemReward ? "Reward applied" : "Redeem reward"}
                  </Button>
                </div>
              </CardContent>
              {!station && (
                <CardFooter className={`justify-between text-sm ${mutedTextClass}`}>
                  <span>Need a station token?</span>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={theme === "dark" ? "text-cyan-300 hover:text-cyan-200" : "text-blue-600 hover:text-blue-500"}
                  >
                    <Link href="/stations">Go to Stations</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Linked loyalty pass</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Scan the wallet QR or paste the pass token below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkedCard ? (
                  <div
                    className={
                      theme === "dark"
                        ? "rounded-lg border border-cyan-500/40 bg-slate-900/60 px-4 py-3 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        : "rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                    }
                  >
                    <p className={`text-sm font-medium ${titleTextClass}`}>{customerName}</p>
                    <p className={theme === "dark" ? "text-xs text-cyan-300" : "text-xs text-zinc-600"}>Token: {loyaltyToken}</p>
                    <p className={`mt-1 text-sm font-medium ${titleTextClass}`}>
                      Balance: {formatPoints(linkedCard.points_balance)}
                    </p>
                  </div>
                ) : (
                  <p className={`text-sm ${mutedTextClass}`}>
                    No loyalty pass linked yet. Use the scanner or paste a token to load one.
                  </p>
                )}
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleManualLookup}>
                  <Input
                    value={loyaltyTokenInput}
                    onChange={(event) => setLoyaltyTokenInput(event.target.value)}
                    placeholder="Paste loyalty token"
                    aria-label="Loyalty card token"
                    className={inputClass}
                  />
                  <Button
                    type="submit"
                    disabled={cardLookupLoading || !loyaltyTokenInput.trim()}
                    className={primaryButtonClass}
                  >
                    {cardLookupLoading ? "Linking…" : "Link card"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Transaction amount</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Enter the purchase total before rewards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className={`text-sm font-medium ${titleTextClass}`} htmlFor="transaction-amount">
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
                  className={inputClass}
                />
                <Button
                  type="button"
                  className={`w-full ${primaryButtonClass}`}
                  onClick={handleCompleteTransaction}
                  disabled={isSubmitting || !station}
                >
                  {isSubmitting ? "Recording…" : "Complete transaction"}
                </Button>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Receipt preview</CardTitle>
                <CardDescription className={mutedTextClass}>
                  Final totals are confirmed by the backend after submission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={tableHeaderTextClass}>Line</TableHead>
                      <TableHead className={`text-right ${tableHeaderTextClass}`}>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className={titleTextClass}>Sub-total</TableCell>
                      <TableCell className={`text-right ${titleTextClass}`}>
                        {formatCurrency(amountValue || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={titleTextClass}>Reward</TableCell>
                      <TableCell className={`text-right ${titleTextClass}`}>
                        {redeemReward ? "Applied at checkout" : formatCurrency(0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={`font-semibold ${subtleAccentTextClass}`}>Estimated total</TableCell>
                      <TableCell className={`text-right font-semibold ${subtleAccentTextClass}`}>
                        {formatCurrency(amountValue || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              {linkedCard && (
                <CardFooter className={`justify-between text-xs ${mutedTextClass}`}>
                  <span>Current balance</span>
                  <span className={`font-semibold ${subtleAccentTextClass}`}>
                    {formatPoints(linkedCard.points_balance)}
                  </span>
                </CardFooter>
              )}
            </Card>
          </div>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={titleTextClass}>Recent transactions</CardTitle>
              <CardDescription className={mutedTextClass}>
                Includes the latest activity for this business.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {transactionsError && (
                <div
                  className={
                    theme === "dark"
                      ? "mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                      : "mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                  }
                >
                  {transactionsError}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={tableHeaderTextClass}>ID</TableHead>
                    <TableHead className={tableHeaderTextClass}>Customer</TableHead>
                    <TableHead className={tableHeaderTextClass}>Amount</TableHead>
                    <TableHead className={tableHeaderTextClass}>Points</TableHead>
                    <TableHead className={tableHeaderTextClass}>Station</TableHead>
                    <TableHead className={tableHeaderTextClass}>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className={`text-center text-sm ${mutedTextClass}`}>
                        Loading transactions…
                      </TableCell>
                    </TableRow>
                  )}
                  {!transactionsLoading && transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className={`text-center text-sm ${mutedTextClass}`}>
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {transactions.map((tx) => {
                    const displayName =
                      tx.loyalty_card?.business_customer.customer.name ?? "Guest checkout"
                    return (
                      <TableRow key={tx.id} className={tableRowHoverClass}>
                        <TableCell className={theme === "dark" ? "font-mono text-xs text-cyan-300" : "font-mono text-xs text-zinc-500"}>
                          {tx.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className={titleTextClass}>{displayName}</TableCell>
                        <TableCell className={titleTextClass}>
                          {formatCurrency(tx.final_amount)}
                        </TableCell>
                        <TableCell className={theme === "dark" ? "text-cyan-200" : "text-emerald-700"}>
                          +{formatPoints(tx.points_earned)} / -{formatPoints(tx.points_redeemed)}
                        </TableCell>
                        <TableCell className={titleTextClass}>
                          {tx.station?.name ?? "—"}
                        </TableCell>
                        <TableCell className={mutedTextClass}>
                          {formatDateTime(tx.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className={`justify-between text-sm ${mutedTextClass}`}>
              <span>Total processed</span>
              <span className={`font-semibold ${subtleAccentTextClass}`}>
                {formatCurrency(processedTotal)}
              </span>
            </CardFooter>
          </Card>
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
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90">
          <div className={`w-full max-w-md rounded-2xl p-4 border ${cardClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${titleTextClass}`}>Scan loyalty QR</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsScannerOpen(false)}
                className={outlineButtonClass}
              >
                Close
              </Button>
            </div>
            <div
              className={
                theme === "dark"
                  ? "aspect-square w-full overflow-hidden rounded-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(56,189,248,0.6)]"
                  : "aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
              }
            >
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

