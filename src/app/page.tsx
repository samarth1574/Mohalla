import Link from "next/link";
import { 
  MapPin, 
  Building, 
  ShoppingBag, 
  Calendar, 
  Users, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Briefcase, 
  Map,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 relative overflow-hidden transition-colors duration-200">
      {/* Decorative Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-extrabold text-xl">M</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              Mohalla
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-500/10">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen Hyperlocal Network for India</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto">
          Connect with the pulse of your{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400">
            Neighborhood
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          Mohalla brings verified apartment residents, local businesses, lost & found assistance, community jobs, 
          real-time messaging, and localized emergency volunteers together in a single premium experience.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold transition shadow-xl shadow-black/10 dark:shadow-white/5">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 font-semibold transition">
              Find my Society
            </Button>
          </Link>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="mt-16 md:mt-24 relative rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-4 shadow-2xl">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 aspect-[16/9] flex flex-col">
            {/* Top status bar mock */}
            <div className="h-10 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Indiranagar, Bengaluru</span>
              </div>
              <div className="w-16" />
            </div>

            {/* Mock Dashboard Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Mock */}
              <div className="w-48 bg-white dark:bg-zinc-900/80 border-r border-slate-200 dark:border-zinc-800 p-4 hidden md:flex flex-col gap-4 text-left">
                <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="space-y-2 pt-2">
                  {[
                    { label: "Community Feed", icon: Users, active: true },
                    { label: "Marketplace", icon: ShoppingBag },
                    { label: "Emergency SOS", icon: ShieldAlert },
                    { label: "Map Heatmap", icon: Map },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                        item.active 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "text-slate-500 dark:text-zinc-400"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${item.active ? "text-emerald-500" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Content Mock */}
              <div className="flex-1 p-6 overflow-y-auto text-left space-y-6 bg-slate-50 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-8 w-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs font-bold text-emerald-600">
                        SS
                      </div>
                      <div>
                        <h4 className="text-xs font-bold dark:text-zinc-200">Samarth Shekhar</h4>
                        <p className="text-[10px] text-zinc-500">Gaur City 2 • 5 mins ago</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Does anyone know a reliable plumber in Sector 16? Facing some leakage in the main kitchen pipe line. Recommendations welcome!
                    </p>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-500 font-semibold">#Recommendations</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-500 font-semibold">#Plumbing</span>
                    </div>
                  </div>
                  {/* Card 2 */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-xs font-bold text-red-600">
                        EM
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400">EMERGENCY SOS ALERT</h4>
                        <p className="text-[10px] text-zinc-500">Prestige Tech Park • 12 mins ago</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100">
                      Medical Assistance Needed: Blood Donor Required (O+ve)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Location: Block A, Room 405. Volunteer responders needed immediately.
                    </p>
                    <div className="h-6 w-20 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                      Respond
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              One Unified Portal for Your Local Needs
            </h2>
            <p className="mt-4 text-slate-500 dark:text-zinc-400">
              Forget cluttered WhatsApp groups and unverified local forums. Mohalla builds trust through verified identities and dedicated modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Society Portals</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Connect your housing society (e.g. Gaur City, Prestige) as a first-class entity. Private announcements, verification requests, and resident rosters.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hyperlocal Marketplace</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Buy, sell, exchange, or rent items directly with neighbors. Protected by AI scam detection and safe handshake coordinates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Emergency SOS alerts</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Broadcast medical, safety, or natural disaster warnings. Verified nearby residents who sign up as emergency responders receive immediate push alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Jobs & Local Services</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Hire local helpers, tutors, housekeepers, or drivers. Post freelance gigs and part-time internships visible to surrounding blocks.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Proximity Heatmap</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Render listings, services, events, and emergency alerts geographically on a Mapbox interface to discover the neighborhood's active zones.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors group relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Group Chat</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Connect directly using Supabase WebSockets. Instant society chat rooms, local event interest coordination, and private messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 py-12 bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-sm shadow">
              M
            </div>
            <span className="font-bold tracking-tight text-slate-800 dark:text-zinc-200">
              Mohalla
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-emerald-500 transition-colors">Contact</Link>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} Mohalla India Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
