import { LoginForm } from '@/components/login-form'
import Link from 'next/link'                // ← required import
import { Button } from '@/components/ui/button'
import { IconHome } from '@tabler/icons-react'   // optional – nice home icon

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 md:p-10">
        {/* Top: Logo */}
        <div className="flex justify-center md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <img
              src="/logo.png"
              alt="LoyaltyPass Logo"
              className="size-12 object-contain mix-blend-darken"
            />
            LoyaltyPass Inc.
          </a>
        </div>

        {/* Center: Login Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>

        {/* Bottom: Small Home button */}
        <div className="flex justify-center pb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/home" className="flex items-center gap-2">
              <IconHome className="size-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Right-side image */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/bg.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}