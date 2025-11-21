"use client"

import * as React from "react"

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
import { cn } from "@/lib/utils"

type LoyaltyCustomer = {
  id: number
  name: string
  phone_number?: string | null
}

type BusinessCustomerApi = {
  id: number
  customer: {
    id: number
    name: string
    phone_number?: string | null
  }
}

type IssueResponse = {
  customer: {
    id: number
    name: string
    phone_number?: string | null
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

const STATION_TOKEN =
  process.env.NEXT_PUBLIC_STATION_TOKEN ?? ""

type ThemeMode = "light" | "dark"

export default function LoyaltyCardsPage() {

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

  const primaryButtonClass =
    theme === "dark"
      ? "bg-[#0A4CFF] hover:bg-[#0840D6] text-white border border-[#0A4CFF] rounded-md"
      : "bg-white hover:bg-zinc-100 text-black border border-zinc-300 rounded-md"

  const tableHeaderClass =
    "bg-transparent [&_th]:text-black dark:[&_th]:text-white"
  const tableCellTextClass = theme === "dark" ? "text-white" : "text-black"
  const tableMutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"

  const [customers, setCustomers] = React.useState<LoyaltyCustomer[]>([])
  const [form, setForm] = React.useState({ name: "", phone: "" })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function fetchLoyaltyCustomers() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `${API_BASE_URL}/api/businesscustomers/`,
          { credentials: "include" }
        )

        if (res.status === 403 || res.status === 404) {
          if (!cancelled) setCustomers([])
          return
        }

        if (!res.ok) {
          throw new Error()
        }

        const data: BusinessCustomerApi[] = await res.json()
        if (cancelled) return

        const uiData: LoyaltyCustomer[] = data.map((bc) => ({
          id: bc.customer?.id ?? bc.id,
          name: bc.customer?.name ?? "(no name)",
          phone_number: bc.customer?.phone_number ?? null,
        }))

        setCustomers(uiData)
      } catch {
        if (!cancelled) {
          setError("Unable to load loyalty cards")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLoyaltyCustomers()
    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const customer_name = form.name.trim()
    const phone_number = form.phone.trim()

    if (!customer_name || !phone_number) return

    try {
      setLoading(true)

      const res = await fetch(
        `${API_BASE_URL}/api/loyaltycards/issue/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Station-Token": STATION_TOKEN,
          },
          credentials: "include",
          body: JSON.stringify({
            customer_name,
            phone_number,
          }),
        }
      )

      if (res.status === 403) {
        setError("Failed to process")
        return
      }

      if (!res.ok) {
        setError("Failed to add loyalty card")
        return
      }

      const data: IssueResponse = await res.json()
      const c = data.customer

      setCustomers((prev) => {
        const existing = prev.find((p) => p.id === c.id)
        if (existing) {
          return prev.map((p) =>
            p.id === c.id
              ? {
                  ...p,
                  name: c.name,
                  phone_number: c.phone_number ?? p.phone_number,
                }
              : p
          )
        }
        return [
          ...prev,
          {
            id: c.id,
            name: c.name,
            phone_number: c.phone_number ?? null,
          },
        ]
      })

      setForm({ name: "", phone: "" })
    } catch {
      setError("Failed to process")
    } finally {
      setLoading(false)
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

        <div className={`flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6 ${pageBgClass}`}>
          <h1 className="text-2xl font-semibold tracking-tight">
            Loyalty Cards
          </h1>

          <form
            onSubmit={handleAddCustomer}
            className={cn(
              "flex flex-col gap-3 p-4 md:flex-row md:items-end",
              cardBaseClass,
            )}
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
                className={inputClass}
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="555-123-4567"
                className={inputClass}
              />
            </div>

            <Button
              type="submit"
              className={cn("md:self-stretch md:px-6", primaryButtonClass)}
            >
              Add Loyalty Card
            </Button>
          </form>

          {error && (
            <p className={cn("text-sm", tableMutedTextClass)}>
              {error}
            </p>
          )}

          <div className={cn("rounded-lg p-4", cardBaseClass)}>
            <h2 className="mb-3 text-lg font-semibold">
              Registered Loyalty Cards
            </h2>

            <div className="rounded-lg border bg-transparent">
              <Table>
                <TableHeader className={tableHeaderClass}>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className={cn("text-center text-sm", tableMutedTextClass)}
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className={tableCellTextClass}>
                          {customer.name}
                        </TableCell>
                        <TableCell className={tableCellTextClass}>
                          {customer.phone_number ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}

                  {!loading && customers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className={cn("text-center text-sm", tableMutedTextClass)}
                      >
                        No loyalty cards added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
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
            <p className={theme === "dark" ? "text-sm text-white/70" : "text-sm text-black/70"}>
              © {new Date().getFullYear()} LoyaltyPass Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
