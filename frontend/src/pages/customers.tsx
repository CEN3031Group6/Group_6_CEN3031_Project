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

type Customer = {
  id: number
  name: string
  email: string
}

const initialCustomers: Customer[] = [
  { id: 1, name: "Alice Smith", email: "alice@example.com" },
  { id: 2, name: "Bob Johnson", email: "bob@example.com" },
]

export default function CustomersPage() {
  const [customers] = React.useState<Customer[]>(initialCustomers)
  const [filteredCustomers, setFilteredCustomers] =
    React.useState<Customer[]>(initialCustomers)

  const [form, setForm] = React.useState({
    name: "",
    email: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    const nameQuery = form.name.trim().toLowerCase()
    const emailQuery = form.email.trim().toLowerCase()

    // If both fields empty, show all customers
    if (!nameQuery && !emailQuery) {
      setFilteredCustomers(customers)
      return
    }

    const results = customers.filter((customer) => {
      const matchesName =
        !nameQuery || customer.name.toLowerCase().includes(nameQuery)
      const matchesEmail =
        !emailQuery || customer.email.toLowerCase().includes(emailQuery)
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
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
