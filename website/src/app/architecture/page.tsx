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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-7 text-white/70 md:text-lg">{body}</p> : null}
    </div>
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
          <Link href="/#product" className="text-sm text-white/70 transition hover:text-white">Product</Link>
          <Link href="/demo" className="text-sm text-white/70 transition hover:text-white">Demo</Link>
          <Link href="/architecture" className="text-sm text-white/70 transition hover:text-white">Architecture</Link>
          <Link href="https://github.com/jmr0ck/colosseum-jmclaw-action-router" className="text-sm text-white/70 transition hover:text-white">GitHub</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
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

export default function ArchitecturePage() {
  const { architecturePage } = siteContent;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow={architecturePage.hero.eyebrow}
              title={architecturePage.hero.title}
              body={architecturePage.hero.body}
              align="center"
            />
          </div>
        </section>

        {/* Pipeline */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-7xl">
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              EXECUTION PIPELINE
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {architecturePage.pipeline.map((step) => (
                <div key={step} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Modules */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">CORE MODULES</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Modular by design</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              BlinkGuard Operator is structured so trust and execution logic can be reused across wallets, agents, and ecosystem applications.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {architecturePage.modules.map((module) => (
                <div key={module.title} className="rounded-2xl border border-white/10 bg-[#12141A] p-6">
                  <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{module.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BlinkGuard Engine Spotlight */}
        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">BLINKGUARD ENGINE</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">The safety kernel behind the experience</h2>
              <p className="mt-4 text-base leading-7 text-white/70">
                The key differentiator is not just intent-based UX. It is the trust engine that sits between user intent and transaction execution.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <ul className="space-y-3 text-sm leading-6 text-white/80">
                {[
                  "Transaction decoding and classification",
                  "Simulation-backed asset change previews",
                  "Human-readable explanation generation",
                  "Risk scoring and warning surfacing",
                  "Policy-driven allow / warn / block outcomes",
                ].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Open Source Surfaces */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <h2 className="text-3xl font-semibold text-white">{architecturePage.openSourceTitle}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">{architecturePage.openSourceBody}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Policy primitives for transaction safety",
                "Transaction explanation interfaces",
                "Simulation and risk adapters",
                "Embeddable trust SDK for wallets and agents",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[#12141A] p-5 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-8 py-16 text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Built to be open</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75">
              Review the repo, explore the architecture, and consider how BlinkGuard can power trust in your Solana application.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                Back to Home
              </Link>
              <Link href="/demo" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                Watch Demo
              </Link>
              <Link href="https://github.com/jmr0ck/colosseum-jmclaw-action-router" className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-300">
                View GitHub
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
