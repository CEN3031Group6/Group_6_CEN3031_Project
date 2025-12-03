"use client"

import * as React from "react"
import { useRouter } from "next/navigation"  // ADD THIS IMPORT
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconHome,
  IconUsers,
  IconSun,
  IconMoonStars,
} from "@tabler/icons-react"

import { useCurrentUser } from "@/hooks/use-current-user"
import { logoutRequest } from "@/lib/api"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Account",
      url: "/account",
      icon: IconListDetails,
    },
    {
      title: "Station",
      url: "/stations",
      icon: IconChartBar,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Loyalty Cards",
      url: "/LoyaltyCards",
      icon: IconUsers,
    },
    {
      title: "Checkout & Transactions",
      url: "/CheckoutTransactions",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "User Home",
      url: "/homeLoggedIn/",
      icon: IconHome,
    },
  ],
} satisfies {
  navMain: {
    title: string
    url: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }[]
  navClouds: any[]
  navSecondary: {
    title: string
    url: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }[]
}

type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "loyaltypass.theme"

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const body = document.body

  root.dataset.theme = theme
  root.classList.remove("theme-light", "theme-dark")
  root.classList.add(theme === "dark" ? "theme-dark" : "theme-light")

  if (theme === "dark") {
    body.style.backgroundColor = "#000000"
    body.style.color = "#ffffff"
  } else {
    body.style.backgroundColor = "#ffffff"
    body.style.color = "#000000"
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { user, loading, refresh } = useCurrentUser()

  const [theme, setTheme] = React.useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark"
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (stored === "dark" || stored === "light") return stored
    return "dark"
  })

  // Ensure the first client render matches the server-rendered HTML to avoid hydration mismatch.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
  }, [theme])

  const handleLogout = React.useCallback(async () => {
    await logoutRequest()
    await refresh()
    router.push("/login")
  }, [refresh, router])

  // Before mount, force the display to match the server default ("dark")
  const displayTheme = mounted ? theme : "dark"

  const wrapperClass =
    displayTheme === "dark"
      ? "flex h-full flex-col bg-gradient-to-b from-[#010B1A] via-[#000814] to-black text-white"
      : "flex h-full flex-col bg-white text-slate-900"

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className={cn(props.className)}
    >
      <div suppressHydrationWarning className={wrapperClass}>
        <SidebarHeader className="pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/dashboard" className="flex items-center gap-3 text-base font-semibold">
                  <img
                    src="/logo.png"
                    alt="Loyalty Pass"
                    className="h-8 w-8 object-contain"
                  />
                  <span>Loyalty Pass</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-3 w-full">
            <div
              className={cn(
                "flex items-center justify-between rounded-full px-2 py-1 text-[11px] font-medium",
                displayTheme === "dark"
                  ? "bg-slate-900/80 text-slate-100 border border-slate-700"
                  : "bg-slate-100 text-slate-800 border border-slate-200",
              )}
            >
              <span className="flex items-center gap-1">
                {displayTheme === "dark" ? (
                  <IconMoonStars className="h-3.5 w-3.5" />
                ) : (
                  <IconSun className="h-3.5 w-3.5" />
                )}
                Theme
              </span>
              <div
                className={cn(
                  "inline-flex rounded-full border p-0.5",
                  displayTheme === "dark"
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setTheme("light")
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(THEME_STORAGE_KEY, "light")
                    }
                    applyTheme("light")
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    displayTheme === "light"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600",
                  )}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme("dark")
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
                    }
                    applyTheme("dark")
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    displayTheme === "dark"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600",
                  )}
                >
                  Dark
                </button>
              </div>
            </div>

            <NavUser
              user={user ?? null}
              loading={loading}
              onLogout={user ? handleLogout : undefined}
            />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
