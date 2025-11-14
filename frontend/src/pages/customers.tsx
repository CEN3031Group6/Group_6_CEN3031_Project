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

type CustomerCore = {
  id: number
  name: string
  email?: string | null
  phone_number?: string | null
}

type BusinessCustomer = {
  id: number
  customer: CustomerCore
}

type UiCustomer = {
  id: number
  name: string
  email?: string | null
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<UiCustomer[]>([])
  const [filteredCustomers, setFilteredCustomers] = React.useState<UiCustomer[]>([])
  const [form, setForm] = React.useState({
    name: "",
    email: "",
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch business customers on mount
  React.useEffect(() => {
    let cancelled = false

    async function fetchCustomers() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `${API_BASE_URL}/api/businesscustomers/`,
        )

        if (!res.ok) {
          throw new Error(`Failed to load customers (status ${res.status})`)
        }

        const data: BusinessCustomer[] = await res.json()

        if (cancelled) return

        // Flatten nested customer into a simpler UI shape
        const uiData: UiCustomer[] = data.map((bc) => ({
          id: bc.customer?.id ?? bc.id,
          name: bc.customer?.name ?? "(no name)",
          email: bc.customer?.email ?? null,
        }))

        setCustomers(uiData)
        setFilteredCustomers(uiData)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load customers.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCustomers()

    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    const nameQuery = form.name.trim().toLowerCase()
    const emailQuery = form.email.trim().toLowerCase()

    if (!nameQuery && !emailQuery) {
      setFilteredCustomers(customers)
      return
    }

    const results = customers.filter((customer) => {
      const matchesName =
        !nameQuery || customer.name.toLowerCase().includes(nameQuery)
      const emailValue = customer.email ?? ""
      const matchesEmail =
        !emailQuery || emailValue.toLowerCase().includes(emailQuery)
      return matchesName && matchesEmail
    })

    setFilteredCustomers(results)
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
              Customers
            </h1>
          </div>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-end"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Customer name"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="customer@example.com"
              />
            </div>

            <Button type="submit" className="md:self-stretch md:px-6">
              Search
            </Button>
          </form>

          {error && (
            <p className="text-sm text-muted-foreground">
              No Current Customers
            </p>
          )}

          {/* Customers table */}
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.id}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email ?? "—"}</TableCell>
                    </TableRow>
                  ))}

                {!loading && filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
