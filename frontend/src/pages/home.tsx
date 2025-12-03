import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-medium group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-10 object-contain mix-blend-darken transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              LoyaltyPass
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-primary/10">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="shadow-lg shadow-primary/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center mb-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Digital Loyalty Platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Manage Your Loyalty
              <br />
              Program with Ease
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              A comprehensive platform for businesses to create, manage, and track digital loyalty cards. Reward your customers and grow your business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Start Free Trial
                  <svg className="ml-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base border-2 hover:border-primary/50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid with enhanced cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
            {[
              {
                icon: (
                  <svg className="size-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Easy Setup",
                description: "Get started in minutes. Create your business profile, set reward rates, and start issuing loyalty cards instantly.",
                gradient: "from-blue-500/10 to-cyan-500/10"
              },
              {
                icon: (
                  <svg className="size-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: "Digital Wallet Integration",
                description: "Customers add loyalty cards directly to Apple Wallet. No apps needed, just scan and go.",
                gradient: "from-purple-500/10 to-pink-500/10"
              },
              {
                icon: (
                  <svg className="size-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-Time Analytics",
                description: "Track customer engagement, points redeemed, and revenue trends with our comprehensive dashboard.",
                gradient: "from-green-500/10 to-emerald-500/10"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <Card className="relative p-8 h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative">
                    <div className={`size-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* CTA Section with enhanced styling */}
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700">
            <Card className="relative overflow-hidden border-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative p-12 lg:p-16 text-center">
                <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join businesses already using LoyaltyPass to grow their customer base and increase repeat visits.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto text-base shadow-lg">
                      Create Your Account
                      <svg className="ml-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-base border-2">
                      Sign In to Existing Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="LoyaltyPass Logo"
                className="size-8 object-contain mix-blend-darken"
              />
              <span className="font-semibold text-foreground/80">LoyaltyPass Inc.</span>
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