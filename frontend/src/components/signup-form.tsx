"use client"

import { useRouter } from "next/router"
import { useState } from "react"

import { API_BASE, safeJson } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SignupFormState = {
  businessName: string
  businessEmail: string
  rewardRate: string
  redemptionPoints: string
  redemptionRate: string
  logoUrl: string
  primaryColor: string
  backgroundColor: string
  password: string
  confirmPassword: string
}

const initialState: SignupFormState = {
  businessName: "",
  businessEmail: "",
  rewardRate: "1.0",
  redemptionPoints: "100",
  redemptionRate: "0.10",
  logoUrl: "",
  primaryColor: "#0057ff",
  backgroundColor: "#ffffff",
  password: "",
  confirmPassword: "",
}

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [form, setForm] = useState(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        business_name: form.businessName,
        reward_rate: form.rewardRate,
        redemption_points: parseInt(form.redemptionPoints, 10),
        redemption_rate: form.redemptionRate,
        logo_url: form.logoUrl,
        primary_color: form.primaryColor,
        background_color: form.backgroundColor,
        username: form.businessEmail,
        password: form.password,
      }

      const response = await fetch(`${API_BASE}/accounts/business-signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(response)

      if (!response.ok) {
        throw new Error(
          (data && typeof data === "object" && JSON.stringify(data)) ||
            "Unable to create account.",
        )
      }

      setSuccess("Account created! Redirecting to login…")
      setForm(initialState)
      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your business workspace.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
          <Input
            id="businessName"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            type="text"
            placeholder="John Doe's Donuts"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="businessEmail">Business Email (username)</FieldLabel>
          <Input
            id="businessEmail"
            name="businessEmail"
            value={form.businessEmail}
            onChange={handleChange}
            type="email"
            placeholder="owner@example.com"
            required
          />
          <FieldDescription>
            This will be your login username and the contact email for your account.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="rewardRate">Reward Rate</FieldLabel>
          <Input
            id="rewardRate"
            name="rewardRate"
            type="number"
            min="0"
            step="0.1"
            value={form.rewardRate}
            onChange={handleChange}
            required
          />
          <FieldDescription>Points earned per 1.00 in currency spent.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="redemptionPoints">Points Needed for Reward</FieldLabel>
          <Input
            id="redemptionPoints"
            name="redemptionPoints"
            type="number"
            min="1"
            value={form.redemptionPoints}
            onChange={handleChange}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="redemptionRate">Redemption Rate</FieldLabel>
          <Input
            id="redemptionRate"
            name="redemptionRate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={form.redemptionRate}
            onChange={handleChange}
            required
          />
          <FieldDescription>Discount percentage in decimal form (0.10 = 10% off).</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="logoUrl">Logo URL</FieldLabel>
          <Input
            id="logoUrl"
            name="logoUrl"
            value={form.logoUrl}
            onChange={handleChange}
            type="url"
            placeholder="https://example.com/logo.png"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="primaryColor">Card Color</FieldLabel>
          <Input
            id="primaryColor"
            name="primaryColor"
            type="color"
            value={form.primaryColor}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="backgroundColor">Card Background Color</FieldLabel>
          <Input
            id="backgroundColor"
            name="backgroundColor"
            type="color"
            value={form.backgroundColor}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {success}
          </p>
        )}

        <Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <a href="/login" className="underline underline-offset-4">
              Sign in
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
