"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// QR Scanner (no SSR)
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.QrScanner),
  { ssr: false }
)

type Transaction = {
  id: number
  totalAmount: number
  createdAt: string
  station?: string
}

const initialTransactions: Transaction[] = []

export default function CheckoutTransactionsPage() {
  const [transactions, setTransactions] =
    React.useState<Transaction[]>(initialTransactions)

  const [totalAmount, setTotalAmount] = React.useState("")
  const [isScannerOpen, setIsScannerOpen] = React.useState(false)
  const [lastScannedCode, setLastScannedCode] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const calculatedTotal = React.useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.totalAmount, 0),
    [transactions]
  )

  function handleAddTransaction() {
    const amountNum = Number(totalAmount)
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) return

    setTransactions(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        totalAmount: amountNum,
        createdAt: new Date().toLocaleString(),
        station: lastScannedCode ? `QR: ${lastScannedCode}` : "Manual",
      }
    ])

    setTotalAmount("")
    setMessage("Transaction added.")
  }

  function handleScanResult(result: string) {
    setLastScannedCode(result)
    setMessage(`QR code scanned: ${result}`)
    setIsScannerOpen(false)
  }

  function handleRedeemPoints() {
    setMessage("Redeem points clicked.")
  }

  function handleCompleteTransaction() {
    setMessage("Complete Transaction clicked.")
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

        <div className="flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              Checkout &amp; Transactions
            </h1>
          </div>

          {/* QR ACTIONS */}
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">QR / Loyalty Actions</p>
              <p className="text-xs text-muted-foreground">
                Scan a QR code or redeem points.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsScannerOpen(true)}>Scan QR Code</Button>
              <Button variant="outline" onClick={handleRedeemPoints}>
                Redeem Points
              </Button>
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="rounded-lg border bg-background p-4">
            <h2 className="mb-3 text-lg font-semibold">Transactions</h2>

            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Stations</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.id}</TableCell>
                      <TableCell>${tx.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{tx.createdAt}</TableCell>
                      <TableCell>{tx.station ?? "-"}</TableCell>
                    </TableRow>
                  ))}

                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* GROUPED SECTION */}
          <div className="rounded-lg border bg-background p-4 space-y-6">

            {/* Total Amount */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">Total Amount</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </section>

            {/* Transaction Actions */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">Transaction Actions</h2>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={handleAddTransaction}>
                  Add
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCompleteTransaction}
                >
                  Complete Transaction
                </Button>
              </div>

              {message && (
                <p className="pt-2 text-xs text-muted-foreground">{message}</p>
              )}

              {lastScannedCode && (
                <p className="text-xs text-muted-foreground">
                  Last scanned QR:{" "}
                  <span className="font-mono">{lastScannedCode}</span>
                </p>
              )}
            </section>

            {/* RECEIPT */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Receipt</h3>

              <div className="rounded-lg border bg-background">
                <Table>

                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead> {/* Empty header */}
                      <TableHead className="w-[160px] text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {/* Sub-Total */}
                    <TableRow>
                      <TableCell>Sub-Total</TableCell>
                      <TableCell className="text-right">
                        ${calculatedTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>

                    {/* Discount */}
                    <TableRow>
                      <TableCell>Discount</TableCell>
                      <TableCell className="text-right">$0.00</TableCell>
                    </TableRow>

                    {/* Complete Total */}
                    <TableRow>
                      <TableCell className="font-semibold">Complete Total</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${calculatedTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </div>
      </SidebarInset>

      {/* CAMERA OVERLAY */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scan QR Code</h2>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsScannerOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="aspect-square w-full overflow-hidden rounded-lg border">
              <QrScanner
                onDecode={(result) => result && handleScanResult(result)}
                onError={(err) => console.error(err)}
                constraints={{ facingMode: "environment" }}
              />
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}
