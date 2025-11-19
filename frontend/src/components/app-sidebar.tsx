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
      icon: IconFolder,
    },
    {
      title: "Loyalty Cards",
      url: "/LoyaltyCards",
      icon: IconUsers,
    },
    {
      title: "Checkout & Transactions",
      url: "CheckoutTransactions",
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { user, loading, refresh } = useCurrentUser()

  const handleLogout = React.useCallback(async () => {
    await logoutRequest()
    await refresh()
    router.push("/login")
  }, [refresh, router])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/" className="flex items-center gap-3 py-2">
                  <img src="/logo.png" alt="Loyalty Pass" className="h-9 w-9" />
                  <span className="text-lg font-semibold tracking-tight">
                    Loyalty Pass
                  </span>
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
        <NavUser user={user ?? null} loading={loading} onLogout={user ? handleLogout : undefined} />
      </SidebarFooter>
    </Sidebar>
  )
}