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

export default function AccountPage() {
  const { user, loading, error, refresh } = useCurrentUser()
  const [passwordForm, setPasswordForm] = React.useState<PasswordFormState>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  const [isRefreshing, startRefreshTransition] = React.useTransition()

  const initials = React.useMemo(() => {
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
      toast.error("Please complete all password fields.")
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New password and confirmation do not match.")
      return
    }

    setIsUpdatingPassword(true)
    try {
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

  const handleRefreshProfile = React.useCallback(() => {
    startRefreshTransition(() => {
      void refresh()
    })
  }, [refresh])

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
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
          <header className="rounded-2xl border bg-card px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Account Center</p>
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                  {user?.name || "Your profile"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your login, business identity, and security settings in one place.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRefreshProfile} disabled={isRefreshing || loading}>
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <Button variant="secondary" onClick={() => toast.info("Business branding editor coming soon.")}>
                  Customize Branding
                </Button>
              </div>
            </div>
          </header>

          {error && !loading ? (
            <Card className="border-destructive/50 bg-destructive/5 text-destructive">
              <CardHeader>
                <CardTitle>Unable to load profile</CardTitle>
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
            <Card className="shadow-xs">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile overview</CardTitle>
                  <p className="text-sm text-muted-foreground">
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
                    <AvatarFallback className="rounded-2xl text-lg font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <ProfileField label="Full name" value={loading ? undefined : user?.name} />
                  <ProfileField label="Username" value={loading ? undefined : user?.username} />
                  <ProfileField label="Email" value={loading ? undefined : user?.email} />
                  <ProfileField label="Business" value={loading ? undefined : user?.business?.name} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Business identity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick reference for the account currently signed in.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileField label="Business name" value={loading ? undefined : user?.business?.name} stacked />
                <ProfileField label="Business ID" value={loading ? undefined : user?.business?.id} stacked />
                <ProfileField label="User ID" value={loading ? undefined : user?.id} stacked />
              </CardContent>
              <CardFooter className="justify-end text-sm text-muted-foreground">
                Need to move this account to another business? Contact support.
              </CardFooter>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Contact details</CardTitle>
                <p className="text-sm text-muted-foreground">
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
                  />
                  <ReadOnlyInput
                    id="contact-email"
                    label="Email"
                    value={loading ? "" : user?.email ?? ""}
                    placeholder="Not provided"
                  />
                  <ReadOnlyInput
                    id="contact-username"
                    label="Username"
                    value={loading ? "" : user?.username ?? ""}
                    placeholder="Not provided"
                  />
                  <ReadOnlyInput
                    id="contact-business"
                    label="Business"
                    value={loading ? "" : user?.business?.name ?? ""}
                    placeholder="Not provided"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Password & security</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your credentials to keep your account secure.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange("current_password")}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange("new_password")}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange("confirm_password")}
                      placeholder="Repeat new password"
                    />
                  </div>
                  <CardFooter className="flex items-center justify-between px-0">
                    <p className="text-xs text-muted-foreground">
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
                      >
                        Clear
                      </Button>
                      <Button type="submit" disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? "Updating…" : "Update password"}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </section>

          {!loading && !user && !error ? (
            <Card className="border-dashed border-primary bg-primary/5 text-center">
              <CardHeader>
                <CardTitle>Sign in to manage your account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t find an active session. Please sign in again to view your business profile.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button asChild>
                  <a href="/login">Go to login</a>
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </div>
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
      <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
      {value ? (
        <p className="text-sm font-medium text-foreground break-all">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  )
}

type ReadOnlyInputProps = {
  id: string
  label: string
  value: string
  placeholder?: string
}

function ReadOnlyInput({ id, label, value, placeholder }: ReadOnlyInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} readOnly />
    </div>
  )
}
