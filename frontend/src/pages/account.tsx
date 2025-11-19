"use client"

import * as React from "react"
import { toast } from "sonner"

import { useCurrentUser } from "@/hooks/use-current-user"
import { updatePassword } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type PasswordFormState = {
  current_password: string
  new_password: string
  confirm_password: string
}

type ThemeMode = "light" | "dark"

export default function AccountPage() {
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

  const cardClass =
    theme === "dark"
      ? "bg-black border border-blue-300 rounded-lg text-white shadow-lg shadow-black/30"
      : "bg-white border border-zinc-200 rounded-2xl text-black shadow-sm"

  const headerLabelClass =
    theme === "dark"
      ? "text-xs font-medium uppercase tracking-wide text-blue-300"
      : "text-xs font-medium uppercase tracking-wide text-zinc-400"

  const primaryButtonClass =
    theme === "dark"
      ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-md"
      : "bg-black hover:bg-zinc-900 text-white rounded-md"

  const outlineButtonClass =
    theme === "dark"
      ? "border border-blue-400 text-blue-300 hover:bg-blue-900/20 rounded-md"
      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded-md"

  const inputClass =
    theme === "dark"
      ? "bg-black border border-blue-400 focus-visible:ring-blue-500 text-white placeholder:text-gray-400 rounded-md"
      : "bg-white border border-zinc-300 focus-visible:ring-zinc-500 text-black placeholder:text-zinc-400 rounded-md"

  const titleTextClass = theme === "dark" ? "text-sky-50" : "text-black"
  const mutedTextClass = theme === "dark" ? "text-slate-300" : "text-zinc-500"

  const footerClass =
    theme === "dark"
      ? "mt-auto w-full bg-black text-white border-t border-blue-900/50"
      : "mt-auto w-full bg-white text-black border-t border-zinc-200"

  const { user, loading, error, refresh } = useCurrentUser()
  const [passwordForm, setPasswordForm] = React.useState<PasswordFormState>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefreshProfile = React.useCallback(() => {
    setIsRefreshing(true)
    refresh().finally(() => setIsRefreshing(false))
  }, [refresh])

  const userInitials = React.useMemo(() => {
    if (!user?.name) return "U"

    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }, [user?.name])

  const handlePasswordChange = (field: keyof PasswordFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error("Fill in all password fields.")
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New password and confirmation do not match.")
      return
    }

    try {
      setIsUpdatingPassword(true)
      await updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      toast.success("Password updated successfully.")
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update password.")
    } finally {
      setIsUpdatingPassword(false)
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
        <div className={`flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 ${pageBgClass}`}>
          <header className={`rounded-2xl px-6 py-5 ${cardClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={headerLabelClass}>Account Center</p>
                <h1 className={`text-2xl font-semibold tracking-tight ${titleTextClass}`}>
                  {user?.name || "Your profile"}
                </h1>
                <p className={`text-sm ${mutedTextClass}`}>
                  Manage your login, business identity, and security settings in one place.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefreshProfile}
                  disabled={isRefreshing || loading}
                  className={outlineButtonClass}
                >
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.info("Business branding editor coming soon.")}
                  className={primaryButtonClass}
                >
                  Customize Branding
                </Button>
              </div>
            </div>
          </header>

          {error ? (
            <Card className="border-destructive/50 bg-destructive/5 text-destructive">
              <CardHeader>
                <CardTitle>We couldn&apos;t load your profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" onClick={handleRefreshProfile}>
                  Try again
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className={cardClass}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className={titleTextClass}>Profile overview</CardTitle>
                  <p className={`text-sm ${mutedTextClass}`}>
                    See what your customers and teammates see.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                {loading ? (
                  <Skeleton className="h-24 w-24 rounded-2xl" />
                ) : (
                  <Avatar className="h-24 w-24 rounded-2xl border">
                    <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? "User avatar"} />
                    <AvatarFallback
                      className={
                        theme === "dark"
                          ? "h-full w-full rounded-2xl bg-slate-100 text-black text-lg font-semibold flex items-center justify-center"
                          : "h-full w-full rounded-2xl bg-zinc-100 text-black text-lg font-semibold flex items-center justify-center"
                      }
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <ProfileField label="Full name" value={loading ? undefined : user?.name} />
                  <ProfileField label="Username" value={loading ? undefined : user?.username} />
                  <ProfileField label="Email" value={loading ? undefined : user?.email} />
                  <ProfileField
                    label="Business"
                    value={loading ? undefined : user?.business?.name}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Business identity</CardTitle>
                <p className={`text-sm ${mutedTextClass}`}>
                  Quick reference for the account currently signed in.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileField label="Business name" value={loading ? undefined : user?.business?.name} stacked />
                <ProfileField label="Business ID" value={loading ? undefined : user?.business?.id} stacked />
                <ProfileField label="User ID" value={loading ? undefined : user?.id} stacked />
              </CardContent>
              <CardFooter className={`justify-end text-sm ${mutedTextClass}`}>
                Need to move this account to another business? Contact support.
              </CardFooter>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Contact details</CardTitle>
                <p className={`text-sm ${mutedTextClass}`}>
                  These are read-only for now. Contact your admin to update them.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyInput
                    id="contact-name"
                    label="Name"
                    value={loading ? "" : user?.name ?? ""}
                    placeholder="Not provided"
                    inputClass={inputClass}
                  />
                  <ReadOnlyInput
                    id="contact-email"
                    label="Email"
                    value={loading ? "" : user?.email ?? ""}
                    placeholder="Not provided"
                    inputClass={inputClass}
                  />
                  <ReadOnlyInput
                    id="contact-username"
                    label="Username"
                    value={loading ? "" : user?.username ?? ""}
                    placeholder="Not provided"
                    inputClass={inputClass}
                  />
                  <ReadOnlyInput
                    id="contact-business"
                    label="Business"
                    value={loading ? "" : user?.business?.name ?? ""}
                    placeholder="Not provided"
                    inputClass={inputClass}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleTextClass}>Password & security</CardTitle>
                <p className={`text-sm ${mutedTextClass}`}>
                  Update your credentials to keep your account secure.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      className={inputClass}
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange("current_password")}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      className={inputClass}
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange("new_password")}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      className={inputClass}
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange("confirm_password")}
                      placeholder="Repeat new password"
                    />
                  </div>
                  <CardFooter className="flex items-center justify-between px-0">
                    <p className={`text-xs ${mutedTextClass}`}>
                      Password must be at least 8 characters.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setPasswordForm({ current_password: "", new_password: "", confirm_password: "" })
                        }
                        disabled={isUpdatingPassword}
                        className={outlineButtonClass}
                      >
                        Clear
                      </Button>
                      <Button type="submit" disabled={isUpdatingPassword} className={primaryButtonClass}>
                        {isUpdatingPassword ? "Updating…" : "Update password"}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </section>

          <Card className="border-dashed border-primary bg-primary/5 text-center">
            <CardFooter className="justify-center">
              <div className="space-y-2 py-6">
                <p className="text-sm font-medium">Sign in to manage your account</p>
                <p className="text-xs text-muted-foreground">
                  We couldn&apos;t find an active session. Please sign in again to view your business profile.
                </p>
                <Button asChild className={primaryButtonClass}>
                  <a href="/login">Go to login</a>
                </Button>
              </div>
            </CardFooter>
          </Card>
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

type ProfileFieldProps = {
  label: string
  value?: string | null
  stacked?: boolean
}

function ProfileField({ label, value, stacked = false }: ProfileFieldProps) {
  return (
    <div className={stacked ? "flex flex-col gap-1" : "space-y-1"}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      {value ? (
        <p className="text-sm font-medium break-all">{value}</p>
      ) : (
        <p className="text-sm opacity-70">Not provided</p>
      )}
    </div>
  )
}

type ReadOnlyInputProps = {
  id: string
  label: string
  value: string
  placeholder?: string
  inputClass: string
}

function ReadOnlyInput({ id, label, value, placeholder, inputClass }: ReadOnlyInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} readOnly className={inputClass} />
    </div>
  )
}
