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

export default function LoyaltyCardsPage() {
  const [customers, setCustomers] = React.useState<LoyaltyCustomer[]>([])
  const [form, setForm] = React.useState({ name: "", phone: "" })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Load existing loyalty customers
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

        // Treat 403 / 404 as "no cards yet"
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

        <div className="flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Loyalty Cards
          </h1>

          {/* ADD LOYALTY CARD FORM */}
          <form
            onSubmit={handleAddCustomer}
            className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-end"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
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
              />
            </div>

            <Button type="submit" className="md:self-stretch md:px-6">
              Add Loyalty Card
            </Button>
          </form>

          {error && (
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          )}

          {/* CUSTOMER TABLE */}
          <div className="rounded-lg border bg-background p-4">
            <h2 className="mb-3 text-lg font-semibold">
              Registered Loyalty Cards
            </h2>

            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-sm">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          {customer.phone_number ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}

                  {!loading && customers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-sm">
                        No loyalty cards added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
