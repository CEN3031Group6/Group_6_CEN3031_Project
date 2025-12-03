"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { logoutRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  IconDashboard,
  IconUsers,
  IconChartBar,
  IconFileDescription,
  IconCreditCard,
  IconSettings,
  IconSparkles,
  IconArrowRight,
  IconLogout
} from "@tabler/icons-react"
import * as React from "react"

export default function HomeLoggedIn() {
  const { user, loading, refresh } = useCurrentUser()
  const router = useRouter()

  const handleLogout = React.useCallback(async () => {
    await logoutRequest()
    await refresh()
    router.push("/login")
  }, [refresh, router])

  if (!loading && !user) {
    router.push("/login")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/homeLoggedIn" className="flex items-center gap-3 font-medium group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-10 object-contain mix-blend-darken transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              LoyaltyPass
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <IconSparkles className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {user?.name}
              </span>
            </div>
            <Link href="/dashboard">
              <Button className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Dashboard
                  <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
            >
              <IconLogout className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with animated gradient */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 lg:py-24">
          {/* Welcome Header */}
          <div className="max-w-5xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Welcome back</span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Hello, {user?.name}
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              Managing <span className="font-semibold text-foreground">{user?.business.name}</span>'s loyalty program
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link href="/dashboard">
                <Button size="lg" className="group w-full sm:w-48 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <IconDashboard className="mr-2 size-5 transition-transform group-hover:rotate-12" />
                  Dashboard
                  <IconArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/LoyaltyCards">
                <Button size="lg" variant="outline" className="group w-full sm:w-48 border-2 hover:border-primary/50">
                  <IconCreditCard className="mr-2 size-5" />
                  Create Card
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Access Grid with hover effects */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
            {[
              {
                href: "/dashboard",
                icon: IconDashboard,
                title: "Dashboard",
                description: "View metrics, transactions, and customer insights",
                gradient: "from-blue-500/10 to-cyan-500/10",
                iconColor: "text-blue-600 dark:text-blue-400"
              },
              {
                href: "/customers",
                icon: IconUsers,
                title: "Customers",
                description: "Manage your customer base and track engagement",
                gradient: "from-purple-500/10 to-pink-500/10",
                iconColor: "text-purple-600 dark:text-purple-400"
              },
              {
                href: "/stations",
                icon: IconChartBar,
                title: "Stations",
                description: "Monitor station readiness and checkout locations",
                gradient: "from-green-500/10 to-emerald-500/10",
                iconColor: "text-green-600 dark:text-green-400"
              },
              {
                href: "/LoyaltyCards",
                icon: IconCreditCard,
                title: "Loyalty Cards",
                description: "Create and manage digital loyalty cards",
                gradient: "from-orange-500/10 to-red-500/10",
                iconColor: "text-orange-600 dark:text-orange-400"
              },
              {
                href: "/CheckoutTransactions",
                icon: IconFileDescription,
                title: "Transactions",
                description: "View and create transactions, track points",
                gradient: "from-yellow-500/10 to-amber-500/10",
                iconColor: "text-yellow-600 dark:text-yellow-500"
              },
              {
                href: "/account",
                icon: IconSettings,
                title: "Settings",
                description: "Update profile, change password, manage account",
                gradient: "from-slate-500/10 to-gray-500/10",
                iconColor: "text-slate-600 dark:text-slate-400"
              }
            ].map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <Card className="relative p-6 h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative">
                    <div className="mb-4">
                      <div className={`size-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`size-7 ${item.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <IconArrowRight className="ml-1 size-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Business Info Card with enhanced styling */}
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-1000">
            <Card className="relative overflow-hidden border-2">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              {/* Content */}
              <div className="relative p-3 text-center">
                <h2 className="text-4xl p-4 font-bold mb-3 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {user?.business.name}
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto group shadow-lg">
                      View Dashboard
                      <IconArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/account">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2">
                      <IconSettings className="mr-2 size-4" />
                      Manage Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-8 object-contain mix-blend-darken"
              />
              <span className="font-semibold text-foreground/80">LoyaltyPass Inc.</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LoyaltyPass Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}