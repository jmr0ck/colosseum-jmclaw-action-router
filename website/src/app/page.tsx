import Link from "next/link";
import Image from "next/image";
import { siteContent } from "@/content/site";

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-7 text-white/70 md:text-lg">{body}</p> : null}
    </div>
  );
}

function RiskBadge({ level }: { level: "safe" | "caution" | "blocked" }) {
  const styles = {
    safe: "bg-green-500/15 text-green-400 border-green-500/30",
    caution: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    blocked: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles[level]}`}>
      {level}
    </span>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0B0F]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/blinkguard-logo.jpg" alt="BlinkGuard logo" width={36} height={36} className="rounded-md" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">{siteContent.brand.name}</span>
            <span className="text-xs text-white/60">{siteContent.brand.productName}</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {siteContent.nav.links.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-white/70 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/demo" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-300">
            Watch Demo
          </Link>
          <Link href="https://github.com/jmr0ck/colosseum-jmclaw-action-router" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
            View GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">{siteContent.footer.note}</p>
        </div>
        <div className="flex gap-6">
          {siteContent.footer.links.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-6 py-24 md:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{siteContent.hero.eyebrow}</p>

              <div className="mb-6 flex items-center gap-4">
                <Image src="/brand/blinkguard-logo.jpg" alt="BlinkGuard logo" width={72} height={72} className="rounded-2xl" />
                <div>
                  <p className="text-2xl font-semibold text-white">{siteContent.brand.productName}</p>
                  <p className="text-sm text-white/60">{siteContent.brand.tagline}</p>
                </div>
              </div>

              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">{siteContent.hero.headline}</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">{siteContent.hero.subheadline}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={siteContent.hero.primaryCta.href} className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-300">
                  {siteContent.hero.primaryCta.label}
                </Link>
                <Link href={siteContent.hero.secondaryCta.href} className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                  {siteContent.hero.secondaryCta.label}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {siteContent.hero.bullets.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-white/10 bg-[#12141A] p-6 shadow-2xl shadow-cyan-500/5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-white/50">Intent Console</span>
                  <RiskBadge level="safe" />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">User Intent</p>
                  <p className="mt-2 text-base text-white">{siteContent.hero.mockIntent}</p>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">Route</p>
                    <p className="mt-2 text-sm text-white/70">Jupiter route selected · estimated output: 8.42 SOL</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">BlinkGuard Review</p>
                    <ul className="mt-2 space-y-2 text-sm text-white/70">
                      <li>• Simulation completed</li>
                      <li>• No dangerous approvals detected</li>
                      <li>• Slippage within policy threshold</li>
                    </ul>
                  </div>

                  <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black">Approve Execution</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02] px-6 py-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-white/60">{siteContent.trustStrip.text}</p>
            <div className="flex flex-wrap gap-3">
              {siteContent.trustStrip.items.map((item) => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24" id="product">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <SectionHeading title={siteContent.problem.title} body={siteContent.problem.body} />
            <div className="grid gap-4">
              {siteContent.problem.pains.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title={siteContent.solution.title} body={siteContent.solution.body} align="center" />
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {siteContent.solution.flow.map((step) => (
                <div key={step} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title={siteContent.howItWorks.title} align="center" />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {siteContent.howItWorks.steps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-[#12141A] p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-300">{index + 1}</div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title={siteContent.features.title} align="center" />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {siteContent.features.items.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title={siteContent.whySolana.title} body={siteContent.whySolana.body} align="center" />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {siteContent.whySolana.items.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#12141A] p-6">
              <div className="aspect-video rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/50">Demo Preview</p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-black/20 p-4 text-sm text-white">{siteContent.demoPreview.exampleRequest}</div>
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                    Simulation passed · risk within threshold
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeading title={siteContent.demoPreview.title} />
              <ul className="mt-6 space-y-3 text-white/70">
                {siteContent.demoPreview.bullets.map((item) => (
                  <li key={item} className="text-base leading-7">• {item}</li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href={siteContent.demoPreview.cta.href} className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-300">
                  {siteContent.demoPreview.cta.label}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title={siteContent.openSource.title} body={siteContent.openSource.body} align="center" />
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {siteContent.openSource.items.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <SectionHeading title={siteContent.vision.title} body={siteContent.vision.body} align="center" />
            <p className="mt-6 text-lg font-medium text-white">{siteContent.vision.closing}</p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-8 py-16 text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">{siteContent.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75">{siteContent.finalCta.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {siteContent.finalCta.actions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={
                    ("primary" in action && action.primary)
                      ? "rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-300"
                      : "rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
