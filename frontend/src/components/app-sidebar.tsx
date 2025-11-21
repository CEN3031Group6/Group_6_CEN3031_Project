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
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
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

  const [theme, setTheme] = React.useState<ThemeMode>("light")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    const initial = stored === "dark" || stored === "light" ? stored : "light"
    setTheme(initial)
    applyTheme(initial)
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

  const wrapperClass =
    theme === "dark"
      ? "flex h-full flex-col bg-gradient-to-b from-[#010B1A] via-[#000814] to-black text-white"
      : "flex h-full flex-col bg-white text-slate-900"

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className={cn(props.className)}
    >
      <div className={wrapperClass}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">Loyalty Pass</span>
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
                theme === "dark"
                  ? "bg-slate-900/80 text-slate-100 border border-slate-700"
                  : "bg-slate-100 text-slate-800 border border-slate-200",
              )}
            >
              <span className="flex items-center gap-1">
                {theme === "dark" ? (
                  <IconMoonStars className="h-3.5 w-3.5" />
                ) : (
                  <IconSun className="h-3.5 w-3.5" />
                )}
                Theme
              </span>
              <div
                className={cn(
                  "inline-flex rounded-full border p-0.5",
                  theme === "dark"
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    theme === "light"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600",
                  )}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    theme === "dark"
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
