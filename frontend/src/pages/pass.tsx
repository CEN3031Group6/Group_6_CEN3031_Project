"use client"

import * as React from "react"
import { useRouter } from "next/router"

import { API_BASE } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function PassDownloadPage() {
  const router = useRouter()
  const [downloading, setDownloading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const slugParam = React.useMemo(() => {
    if (!router.isReady) return ""
    const slug = router.query.slug ?? router.query.station
    if (Array.isArray(slug)) return slug[0]
    return slug ?? ""
  }, [router.isReady, router.query.slug, router.query.station])

  const passApiBase =
    process.env.NEXT_PUBLIC_PASS_API_BASE_URL?.replace(/\/$/, "") || API_BASE

  const passEndpoint = slugParam
    ? `${passApiBase}/api/stations/public/${slugParam}/prepared-pass/?platform=apple&clear=false`
    : ""

  async function handleDownload() {
    if (!passEndpoint) {
      setMessage("Pass download is not configured for this station. Please contact the store.")
      return
    }
    setDownloading(true)
    setMessage(null)
    try {
      const probeUrl = passEndpoint.replace("platform=apple", "platform=json")
      const response = await fetch(probeUrl)
      if (!response.ok) {
        throw new Error("Pass not ready yet. Please ask staff to issue it again.")
      }
      const url = passEndpoint.includes("ts=")
        ? passEndpoint
        : `${passEndpoint}${passEndpoint.includes("?") ? "&" : "?"}ts=${Date.now()}`
      window.location.href = url
      setMessage("If nothing happened, tap the button again or ensure the pass is staged.")
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to download the pass right now.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">
              {slugParam ? `Add Loyalty Card • ${slugParam}` : "Add Loyalty Card"}
            </CardTitle>
            <CardDescription>
              Tap the button below to add the current loyalty pass to Apple Wallet. This page is a
              static link—no sign in required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
              Issued passes rotate after each checkout. If this is your turn, press the button and
              accept the Wallet prompt. Otherwise, wait for staff to prepare your pass.
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={downloading || !router.isReady || !passEndpoint}
              onClick={() => void handleDownload()}
            >
              {downloading ? "Preparing pass…" : "Add to Apple Wallet"}
            </Button>
            {message ? (
              <p className="text-center text-sm text-muted-foreground">{message}</p>
            ) : null}
            {router.isReady && !slugParam ? (
              <p className="text-center text-sm text-destructive">
                This download link is missing a station reference. Please notify the business owner.
              </p>
            ) : null}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
            <p>If the Wallet prompt doesn’t appear, open the Downloads list and tap the .pkpass file.</p>
            <p>
              Need help? Show this screen to a team member so they can reissue the pass for you.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
