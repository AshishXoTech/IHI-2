"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".ihi-reveal")
    );

    // ALWAYS show content immediately (fixes blank black screen)
    elements.forEach((el) => el.classList.add("is-visible"));

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    // Optional: soft fade is already done via is-visible; no hide-on-load
  }, []);
}

function PreviewFrame({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-neutral-950 shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-black px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full border border-white/25" />
        <span className="h-2.5 w-2.5 rounded-full border border-white/25" />
        <span className="h-2.5 w-2.5 rounded-full border border-white/25" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function OperationsPreview() {
  return (
    <PreviewFrame title="Live Operations">
      <div className="bg-neutral-950 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Spring Innovation Challenge
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              Operations overview
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["387", "Registered"],
            ["82", "Teams"],
            ["54", "Finals"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-black p-4"
            >
              <p className="font-mono text-xl font-medium text-white">{value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            <span>Registration capacity</span>
            <span className="text-white">77.4%</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[77%] rounded-full bg-white" />
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function TeamPreview() {
  return (
    <PreviewFrame title="Teams">
      <div className="bg-neutral-950 p-5 sm:p-6">
        <div className="rounded-lg border border-white/10 bg-black p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Signal Foundry</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                Climate & infrastructure
              </p>
            </div>
            <span className="rounded bg-white/10 px-2 py-1 font-mono text-[10px] text-white">
              3 / 4
            </span>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex -space-x-2">
              {["AM", "SK", "JR"].map((initials, i) => (
                <span
                  key={initials}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 text-[10px] font-medium ${
                    i === 2 ? "bg-white text-black" : "bg-neutral-900 text-white"
                  }`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Seeking product
            </span>
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-neutral-500">
          Matches are visible early, so every participant has a path to contribute.
        </p>
      </div>
    </PreviewFrame>
  );
}

function BriefingPreview() {
  return (
    <PreviewFrame title="Submission review">
      <div className="bg-neutral-950 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-white font-mono text-xs text-black">
            ✦
          </span>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white">
            AI Submission Briefing
          </p>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-neutral-400">
          Zero-knowledge identity verification with a client-side signature engine
          and event-driven Postgres indexer.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Rust", "TypeScript", "Docker"].map((tech) => (
            <span
              key={tech}
              className="rounded border border-white/10 bg-black px-2.5 py-1 font-mono text-[10px] text-neutral-300"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-white/10 bg-black p-4 text-xs leading-relaxed text-neutral-500">
          <span className="font-medium text-white">34% structure overlap</span>{" "}
          with the starter template. Core logic is distinct.
        </div>
      </div>
    </PreviewFrame>
  );
}

function SubmissionPreview() {
  return (
    <PreviewFrame title="Final submission">
      <div className="bg-neutral-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Project submission</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              One final handoff, captured reliably.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <p className="font-mono text-xs font-medium text-white">02:14:37</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Repository URL
            </p>
            <div className="rounded border border-white/10 bg-black px-3 py-2.5 font-mono text-xs text-neutral-400">
              github.com/signal-foundry/verify
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Demo link
            </p>
            <div className="rounded border border-white/10 bg-black px-3 py-2.5 font-mono text-xs text-neutral-400">
              verify.signalfoundry.dev
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

const features = [
  {
    title: "See the event as it happens.",
    body: "Registration, teams, submissions, and readiness checks live in one focused operations view. Know where intervention matters before it becomes urgent.",
    preview: <OperationsPreview />,
  },
  {
    title: "Turn sign-ups into capable teams.",
    body: "Give participants a clear place to discover open teams, express skills, and form groups without organizers chasing spreadsheets.",
    preview: <TeamPreview />,
  },
  {
    title: "Make judging evidence-led.",
    body: "Brief reviewers with repository-derived context while keeping confidence signals distinct from event health and human judgement.",
    preview: <BriefingPreview />,
  },
  {
    title: "Capture the final mile.",
    body: "Deadline-aware submission flows keep teams focused and give organizers a trustworthy record of every final handoff.",
    preview: <SubmissionPreview />,
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-black/90 backdrop-blur-md"
            : "bg-black/80 backdrop-blur-sm"
        }`}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-12"
          aria-label="Primary navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center bg-white text-xs font-bold text-black">
              I
            </span>
            IHI
          </Link>

          <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 md:flex">
            <a href="#platform" className="hover:text-white">
              Platform
            </a>
            <a href="#scale" className="hover:text-white">
              Scale
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/team"
              className="bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black hover:bg-neutral-200"
            >
              Workspace
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO — always visible, no fade class on critical text */}
        <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-28 sm:px-12 sm:pb-32 sm:pt-36 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Innovative Hack Intelligence
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              The operating system for serious hackathons.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-400 sm:text-lg">
              IHI gives organizers real-time control over the entire event — from
              registration and team formation through final submission and judging.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/team"
                className="inline-flex h-12 items-center justify-center bg-white px-6 text-sm font-semibold text-black hover:bg-neutral-200"
              >
                Explore the workspace
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center border border-white/25 px-6 text-sm font-medium text-white hover:bg-white hover:text-black"
              >
                Organizer sign in
              </Link>
            </div>
          </div>

          <div className="ihi-reveal is-visible">
            <OperationsPreview />
          </div>
        </section>

        {/* Metrics strip */}
        <section className="border-y border-black bg-white text-black">
          <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-black/10 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-12">
            {[
              ["1,500+", "Participants"],
              ["<200ms", "Data latency"],
              ["99.9%", "Capture rate"],
            ].map(([value, label]) => (
              <div key={label} className="py-12 text-center sm:py-16">
                <p className="font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
                  {value}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Platform features */}
        <section id="platform" className="mx-auto max-w-7xl px-6 py-24 sm:px-12 sm:py-32">
          <div className="ihi-reveal is-visible max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Built for the actual work of running an event.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-400">
              A calmer operating surface for organizers, and clearer next steps for
              everyone participating.
            </p>
          </div>

          <div className="mt-20 space-y-24 sm:mt-32 sm:space-y-36">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`ihi-reveal is-visible grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <h3 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-5 text-base leading-relaxed text-neutral-400 sm:text-lg">
                    {feature.body}
                  </p>
                </div>
                <div>{feature.preview}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Scale */}
        <section id="scale" className="border-t border-white/10 bg-neutral-950">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 sm:py-32">
            <div className="ihi-reveal is-visible max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Designed to scale
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                One reliable system, even when the room gets loud.
              </h2>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
              {[
                ["1,500", "Participants"],
                ["300+", "Teams"],
                ["50", "Judges"],
                ["0", "Manual exports"],
              ].map(([value, label]) => (
                <div key={label} className="bg-neutral-950 p-8 sm:p-10">
                  <p className="font-mono text-3xl font-medium text-white sm:text-4xl">
                    {value}
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="border-t border-white/10 bg-black">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-12 sm:py-32">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Run the event your ideas deserve.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
              Bring registration, collaboration, submissions, and readiness into one
              dependable workspace.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/team"
                className="inline-flex h-12 w-full items-center justify-center bg-white px-8 text-sm font-bold uppercase tracking-[0.15em] text-black hover:bg-neutral-200 sm:w-auto"
              >
                Start organizing
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center border border-white/25 px-8 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-white hover:text-black sm:w-auto"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row sm:px-12">
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center bg-white text-[10px] font-bold text-black">
              I
            </span>
            <span className="font-mono text-xs text-neutral-500">
              © 2026 Innovative Hack Intelligence.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Built for high-stakes deadlines.
          </span>
        </div>
      </footer>
    </div>
  );
}