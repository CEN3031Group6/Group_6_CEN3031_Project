"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

type ThemeMode = "light" | "dark"

export function SiteHeader() {
  const pathname = usePathname()
  const [theme, setTheme] = React.useState<ThemeMode>("light")

  const pageName = React.useMemo(() => {
    if (!pathname) return "Dashboard"
    const parts = pathname.split("/").filter(Boolean)
    const last = parts[parts.length - 1] || "Dashboard"
    return last
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }, [pathname])

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    const getThemeFromDom = () =>
      root.dataset.theme === "dark" ? "dark" : "light"
    setTheme(getThemeFromDom())
    const observer = new MutationObserver(() => {
      setTheme(getThemeFromDom())
    })
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  const headerClass =
    theme === "dark"
      ? "bg-black text-white border-b border-blue-900/50"
      : "bg-white text-black border-b border-zinc-200"

  return (
    <header
      className={`flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ${headerClass}`}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {pageName}
        </h1>
        <div className="ml-auto flex items-center gap-2" />
      </div>
    </header>
  )
}
