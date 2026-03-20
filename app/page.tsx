import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Coins,
  Flame,
  Sparkles,
  TimerReset,
  TrendingUp,
  Users
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { HomeAuthCta } from "@/components/home-auth-cta";
import { primaryNavItems, secondaryNavItems } from "@/lib/constants";

const featureCards = [
  {
    icon: BrainCircuit,
    title: "Gemini-powered planning",
    description: "Split goals into daily blocks, reschedule failures, and receive blunt weekly reports."
  },
  {
    icon: Coins,
    title: "Coins with consequences",
    description: "Complete tasks on time to gain coins. Miss sessions and the system starts charging you."
  },
  {
    icon: Flame,
    title: "Live pressure",
    description: "Study rooms, leaderboards, and failure visibility keep your plan visible when discipline dips."
  }
];

const liveStats = [
  { label: "focus score recovered", value: "74%", icon: TrendingUp },
  { label: "misses rescheduled", value: "18", icon: TimerReset },
  { label: "coins at stake", value: "126", icon: Coins }
];

const proofCards = [
  {
    title: "Clean onboarding path",
    description: "Users can sign in, create a profile, and start the app without confusion or extra friction."
  },
  {
    title: "Built for student momentum",
    description: "Planner, accountability, rooms, and analytics are introduced clearly so students feel focused instead of overwhelmed."
  },
  {
    title: "Modern and confidence-building",
    description: "The landing page feels sharp, trustworthy, and energetic so students want to begin using it right away."
  }
];

const featureTabs = [
  ...primaryNavItems,
  ...secondaryNavItems.filter((item) => item.href !== "/admin")
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#eef5ff] px-4 py-6 text-ink dark:bg-night dark:text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[6%] top-16 h-40 w-40 rounded-full bg-comet/20 blur-3xl" />
        <div className="absolute right-[8%] top-28 h-56 w-56 rounded-full bg-aurora/30 blur-3xl" />
        <div className="absolute bottom-24 left-1/3 h-52 w-52 rounded-full bg-ember/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl sm:rounded-[40px] border border-white/40 bg-[linear-gradient(135deg,rgba(9,17,31,0.97),rgba(28,42,79,0.92),rgba(95,111,255,0.82))] px-4 py-5 sm:px-6 sm:py-6 text-white shadow-glow lg:px-10 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.02fr,0.98fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-white/10 bg-white/10 text-white">StudyOS</Badge>
                <Badge className="border-aurora/20 bg-aurora/15 text-aurora">Preview-first experience</Badge>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl font-display text-3xl font-bold leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
                  A study app students will actually want to open every day.
                </h1>
                <p className="max-w-2xl text-base text-white/76 sm:text-lg">
                  StudyOS helps students plan better, stay consistent, and see progress clearly. Sign in, build your profile, and start using a system that feels serious, motivating, and modern.
                </p>
              </div>

              <HomeAuthCta />

              <div className="grid gap-3 sm:grid-cols-3">
                {liveStats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-aurora" />
                      <p className="mt-4 font-display text-2xl font-bold sm:text-3xl">{item.value}</p>
                      <p className="mt-1 text-sm text-white/70">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <div className="animate-float-slow rounded-[32px] border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[28px] border border-white/10 bg-[#08101f]/90 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-white/45">Today in motion</p>
                      <h2 className="mt-2 font-display text-2xl font-bold">Your plan is visible.</h2>
                    </div>
                    <div className="rounded-2xl bg-aurora/15 p-3 text-aurora">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white/55">Next session</p>
                          <p className="mt-2 font-semibold">Differential equations sprint</p>
                          <p className="mt-1 text-sm text-white/60">06:30 - 08:00 • High priority</p>
                        </div>
                        <span className="animate-pulse-soft rounded-full bg-ember/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ember">
                          Live
                        </span>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[74%] rounded-full bg-gradient-to-r from-aurora to-comet" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-white/55">Missed blocks</p>
                        <p className="mt-2 font-display text-4xl font-bold">2</p>
                        <p className="mt-2 text-sm text-white/60">Auto-recovery already queued for tomorrow.</p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-white/55">Room pressure</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-aurora" />
                          <p className="text-sm text-white/75">11 students active now</p>
                        </div>
                        <div className="mt-4 flex -space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-comet text-sm font-bold">AK</div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-ember text-sm font-bold">DI</div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-aurora text-sm font-bold text-ink">RV</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-white/55">Why it hooks</p>
                          <p className="mt-2 font-semibold">Users understand the product before signup.</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-aurora" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="group border-white/50 bg-white/75 transition duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/5"
              >
                <div className="inline-flex rounded-3xl bg-comet/10 p-4 text-comet transition group-hover:bg-comet group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold">{feature.title}</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
              </Card>
            );
          })}
        </section>

        <section className="rounded-2xl sm:rounded-[32px] border border-white/50 bg-white/80 p-4 sm:p-5 shadow-glow backdrop-blur-xl dark:bg-slate-950/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-comet">All feature tabs</p>
              <h2 className="mt-2 font-display text-xl font-bold sm:text-3xl">See the full website structure in one place.</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Users can understand the full product faster when every major section is visible and clickable from the homepage.
              </p>
            </div>
            <Badge className="w-fit bg-comet text-white">Student-friendly navigation</Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featureTabs.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <div className="group h-full rounded-[24px] border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-comet/40 hover:shadow-glow dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-comet/10 p-3 text-comet transition group-hover:bg-comet group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-comet" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold sm:text-2xl">{item.label}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {item.label === "Dashboard" && "Track execution, misses, coins, and your overall momentum."}
                      {item.label === "Planner" && "Open the AI plan, inspect time blocks, and understand the study flow."}
                      {item.label === "Analytics" && "See focus score, study density, patterns, and weekly insights."}
                      {item.label === "Rooms" && "Browse live study rooms and social accountability spaces."}
                      {item.label === "Leaderboard" && "Check rankings, streaks, coins, and competitive momentum."}
                      {item.label === "Settings" && "Control notifications, blocked sites, and study friction."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.94fr,1.06fr]">
          <Card className="border-white/50 bg-white/80">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-ember/10 p-3 text-ember">
                <Sparkles className="h-5 w-5" />
              </div>
              <Badge>Student-first flow</Badge>
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-bold">
              The website should feel friendly, focused, and immediately useful.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              This version pushes users into a simple sign-in path, cleaner onboarding, and a product identity that feels made for serious students.
            </p>

            <div className="mt-6 space-y-3">
              {proofCards.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden border-white/50 bg-[#09111f] p-0 text-white">
            <div className="grid gap-0 lg:grid-cols-[0.9fr,1.1fr]">
              <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs uppercase tracking-[0.32em] text-white/45">What users notice</p>
                <div className="mt-6 space-y-5">
                  <div className="flex gap-3">
                    <div className="mt-1 rounded-xl bg-aurora/15 p-2 text-aurora">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Shared momentum</p>
                      <p className="mt-1 text-sm text-white/60">Rooms and leaderboard make the product feel social, not lonely.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 rounded-xl bg-comet/15 p-2 text-comet">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Smart planning</p>
                      <p className="mt-1 text-sm text-white/60">AI-generated blocks make the promise concrete instead of vague.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 rounded-xl bg-ember/15 p-2 text-ember">
                      <Flame className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Visible pressure</p>
                      <p className="mt-1 text-sm text-white/60">Misses stay visible, so the system feels honest from the first look.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/45">Fast path</p>
                <h3 className="mt-3 font-display text-3xl font-bold">Sign in, build your profile, start your system.</h3>
                <p className="mt-3 max-w-xl text-sm text-white/65">
                  Students create an account, personalize the experience, and move directly into the app with a clean, focused flow.
                </p>

                <div className="mt-6">
                  <HomeAuthCta />
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
