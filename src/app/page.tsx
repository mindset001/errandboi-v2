import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { HeroScene, EarningsScene } from "./Scenes";
import PwaRedirect from "./PwaRedirect";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <PwaRedirect />
      <Navbar user={user ? { email: user.email! } : null} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div className="text-center lg:text-left">
              <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-500/15 px-4 py-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-6">
                🚀 Fast & Reliable Logistics
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-slate-50 leading-tight mb-6">
                Your city, delivered
                <span className="text-orange-500"> instantly.</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0">
                Book a ride, send a package, or let Errandboi handle your market shopping.
                Fast pickups, real-time tracking, and guaranteed delivery across town.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/book/ride">
                  <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                    🏍️ Book a Ride
                  </Button>
                </Link>
                <Link href="/book/errand">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    🛒 Send to Market
                  </Button>
                </Link>
              </div>
            </div>
            {/* Right — 3D scene */}
            <div className="hidden lg:block">
              <HeroScene />
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-orange-200 dark:bg-orange-600 opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-200 dark:bg-amber-600 opacity-20 blur-3xl" />
      </section>

      {/* Services */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 text-center mb-4">
            What can we do for you?
          </h2>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-12">Choose your service and we&apos;ll handle the rest</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {services.map((s) =>
              s.comingSoon ? (
                <div key={s.title} className="relative rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-6 opacity-75 cursor-not-allowed select-none">
                  <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                    Coming soon
                  </span>
                  <div className="text-4xl mb-4 grayscale">{s.icon}</div>
                  <h3 className="font-bold text-gray-700 dark:text-slate-300 text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 dark:text-slate-500">{s.description}</p>
                </div>
              ) : (
                <Link key={s.title} href={s.href!}>
                  <div className="group rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/50 transition-all cursor-pointer">
                    <div className="text-4xl mb-4">{s.icon}</div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{s.description}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-orange-500 dark:text-orange-400 group-hover:gap-2 transition-all">
                      Book now →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15 text-2xl">
                  {step.emoji}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-orange-500 dark:bg-orange-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-extrabold">{s.value}</div>
                <div className="mt-1 text-sm text-orange-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage area */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <span className="inline-block rounded-full bg-green-100 dark:bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-600 dark:text-green-400 mb-4">
            📍 Where we operate
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 mb-4">
            Now serving two cities
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-12 max-w-xl mx-auto">
            Errandboi is live and taking orders in these cities. More cities coming soon.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {cities.map((city) => (
              <div key={city.name} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-8 flex flex-col items-center gap-3">
                <span className="text-5xl">{city.emoji}</span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{city.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{city.state}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Drive with us */}
      <section className="py-20 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — pitch */}
            <div>
              <span className="inline-block rounded-full bg-orange-500/15 px-4 py-1.5 text-sm font-semibold text-orange-400 mb-5">
                🏍️ For drivers & agents
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                Turn your bike into<br />
                <span className="text-orange-400">a steady income.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Join Errandboi in Ilorin or Osogbo and start earning from rides and market errands. No targets, no pressure — work when you want.
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-5 mb-10">
                {joinSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-extrabold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{step.title}</p>
                      <p className="text-sm text-slate-400">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup?role=driver">
                  <button className="rounded-xl bg-orange-500 hover:bg-orange-600 px-8 py-3.5 font-extrabold text-white text-base transition shadow-lg shadow-orange-500/25">
                    Start Earning Today
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="rounded-xl border border-slate-700 hover:border-slate-500 px-8 py-3.5 font-semibold text-slate-300 hover:text-white text-base transition">
                    I already have an account
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — animated earnings card */}
            <EarningsScene />

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-slate-900 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">
            Join thousands of customers who trust Errandboi every day.
          </p>
          <Link href={user ? "/dashboard" : "/auth/signup"}>
            <Button size="lg" className="shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
              {user ? "Go to Dashboard" : "Create Free Account"}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const services: { icon: string; title: string; description: string; href?: string; comingSoon?: boolean }[] = [
  { icon: "🏍️", title: "Book a Ride", description: "Bike, car, or keke — pick your vehicle and we'll match you with the nearest driver.", href: "/book/ride" },
  { icon: "🛒", title: "Market Errand", description: "Give us your shopping list and we'll handle it. Fresh from the market to your door.", href: "/book/errand" },
  { icon: "🍔", title: "Food Order", description: "Order from your favourite restaurants and get it delivered hot to your door.", comingSoon: true },
];

const steps = [
  { emoji: "📍", title: "Set your location", body: "Enter your pickup and drop-off address, or share your live location for faster matching." },
  { emoji: "✅", title: "Choose & confirm", body: "Pick your vehicle type or errand service, see the price upfront, and confirm with one tap." },
  { emoji: "🚀", title: "Track in real-time", body: "Watch your rider or errand agent live on the map until your order arrives." },
];

const stats = [
  { value: "10k+", label: "Happy Customers" },
  { value: "500+", label: "Active Drivers" },
  { value: "50k+", label: "Orders Delivered" },
  { value: "4.8★", label: "Average Rating" },
];

const cities = [
  { name: "Ilorin", state: "Kwara State", emoji: "🕌" },
  { name: "Osogbo", state: "Osun State", emoji: "🌳" },
];

const joinSteps = [
  { title: "Sign up in minutes", body: "Create your account, upload your licence and vehicle details." },
  { title: "Get verified", body: "Our team reviews your KYC within 24 hours — no office visit needed." },
  { title: "Start accepting orders", body: "Go online anytime and earn from rides and market errands near you." },
];

