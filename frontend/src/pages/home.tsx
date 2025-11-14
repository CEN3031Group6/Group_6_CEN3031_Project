import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <img
              src="/logo.png"
              alt="LoyaltyPass Logo"
              className="size-10 object-contain mix-blend-darken"
            />
            <span className="text-xl font-semibold">LoyaltyPass Inc.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Manage Your Loyalty Program
              <br />
              with Ease
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              LoyaltyPass is a comprehensive platform for businesses to create, manage, and track
              digital loyalty cards. Reward your customers and grow your business with our
              intuitive dashboard and seamless customer experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
            <Card className="p-6">
              <div className="mb-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Setup</h3>
                <p className="text-muted-foreground">
                  Get started in minutes. Create your business profile, set reward rates, and start
                  issuing loyalty cards to your customers.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Digital Wallet Integration</h3>
                <p className="text-muted-foreground">
                  Customers can add loyalty cards directly to their Apple Wallet. No apps needed,
                  just scan and go.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Analytics</h3>
                <p className="text-muted-foreground">
                  Track customer engagement, points redeemed, and revenue trends with our
                  comprehensive dashboard.
                </p>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join businesses already using LoyaltyPass to grow their customer base and increase
                repeat visits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In to Existing Account
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg">Create Your Account</Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-8 object-contain mix-blend-darken"
              />
              <span className="font-medium">LoyaltyPass Inc.</span>
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
