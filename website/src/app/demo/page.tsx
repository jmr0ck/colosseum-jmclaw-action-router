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

export default function DemoPage() {
  const { demoPage } = siteContent;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow={demoPage.hero.eyebrow}
              title={demoPage.hero.title}
              body={demoPage.hero.body}
              align="center"
            />
          </div>
        </section>

        {/* Video / Main Mock */}
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-6xl">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#12141A] p-4 md:p-6">
              <div className="aspect-video rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">Demo Video</p>
                  <p className="mt-2 text-xs text-white/40">Coming soon — screenshots and video walkthrough</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Happy Path */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">{demoPage.happyPath.title}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{demoPage.happyPath.request}</h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {demoPage.happyPath.steps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-[#12141A] p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-sm font-semibold text-green-400">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk Path */}
        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{demoPage.riskPath.title}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">BlinkGuard warns before execution.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">{demoPage.riskPath.body}</p>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                Caution
              </div>
              <ul className="space-y-3 text-sm leading-6 text-white/80">
                {demoPage.riskPath.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* What the demo proves */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <h2 className="text-3xl font-semibold text-white">What the demo proves</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Users understand what they are signing",
                "Simulation happens before execution",
                "Unsafe or unclear actions are flagged early",
                "Approval becomes faster because trust is higher",
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
            <h2 className="text-3xl font-semibold text-white md:text-4xl">See it for yourself</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75">
              Try the live product and explore the architecture behind BlinkGuard Operator.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                Back to Home
              </Link>
              <Link href="/architecture" className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-300">
                Read Architecture
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
