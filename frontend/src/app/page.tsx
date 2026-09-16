"use client";

import { useEffect, useState, type ReactNode } from "react";

function useScrollReveal() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        const elements = Array.from(
            document.querySelectorAll<HTMLElement>(".ihi-reveal"),
        );
        if (reducedMotion) {
            elements.forEach((element) => element.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                }),
            { threshold: 0.12 },
        );
        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [reducedMotion]);
}

function PreviewFrame({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) {
    return (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] shadow-[0_16px_40px_-24px_rgba(28,25,23,0.28)]">
            <div className="flex items-center gap-1.5 border-b border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-50)] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-[var(--ihi-surface-300)]" />
                <span className="h-2 w-2 rounded-full bg-[var(--ihi-surface-300)]" />
                <span className="h-2 w-2 rounded-full bg-[var(--ihi-surface-300)]" />
                <span className="ml-2 text-[11px] font-medium text-[var(--ihi-surface-500)]">
                    {title}
                </span>
            </div>
            {children}
        </div>
    );
}

function OperationsPreview() {
    return (
        <PreviewFrame title="Live operations">
            <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[var(--ihi-surface-500)]">
                            Spring Innovation Challenge
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ihi-surface-900)]">
                            Operations overview
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--ihi-signal-go)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ihi-signal-go)]" />
                        Live
                    </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                        ["387", "Registered"],
                        ["82", "Teams"],
                        ["54", "Finals"],
                    ].map(([value, label]) => (
                        <div
                            key={label}
                            className="rounded-[var(--radius-md)] bg-[var(--ihi-surface-50)] p-3"
                        >
                            <p className="font-mono text-lg font-semibold text-[var(--ihi-surface-900)]">
                                {value}
                            </p>
                            <p className="mt-1 text-[10px] text-[var(--ihi-surface-500)]">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-[var(--ihi-surface-500)]">
                        <span>Registration capacity</span>
                        <span className="font-mono">77.4%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--ihi-surface-200)]">
                        <div className="h-full w-[77%] rounded-full bg-[var(--ihi-signal-go)]" />
                    </div>
                </div>
            </div>
        </PreviewFrame>
    );
}

function TeamPreview() {
    return (
        <PreviewFrame title="Teams">
            <div className="p-5">
                <div className="rounded-[var(--radius-md)] border border-[var(--ihi-surface-200)] p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-semibold text-[var(--ihi-surface-900)]">
                                Signal Foundry
                            </p>
                            <p className="mt-1 text-xs text-[var(--ihi-surface-500)]">
                                Climate & infrastructure
                            </p>
                        </div>
                        <span className="font-mono text-xs text-[var(--ihi-signal-go)]">
                            3 / 4
                        </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--ihi-brand-200)] text-[10px] font-semibold text-[var(--ihi-brand-800)]">
                                AM
                            </span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--ihi-surface-300)] text-[10px] font-semibold text-[var(--ihi-surface-700)]">
                                SK
                            </span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--ihi-signal-go-bg)] text-[10px] font-semibold text-[var(--ihi-signal-go)]">
                                JR
                            </span>
                        </div>
                        <span className="rounded-[var(--radius-sm)] bg-[var(--ihi-surface-100)] px-2 py-1 text-[10px] text-[var(--ihi-surface-600)]">
                            Seeking product
                        </span>
                    </div>
                </div>
                <p className="mt-4 text-xs text-[var(--ihi-surface-500)]">
                    Matches are visible early, so every participant has a path
                    to contribute.
                </p>
            </div>
        </PreviewFrame>
    );
}

function BriefingPreview() {
    return (
        <PreviewFrame title="Submission review">
            <div className="p-5">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--ihi-ai-high-bg)] font-mono text-xs text-[var(--ihi-ai-high)]">
                        ✦
                    </span>
                    <p className="text-xs font-semibold text-[var(--ihi-surface-800)]">
                        AI Submission Briefing
                    </p>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[var(--ihi-surface-600)]">
                    Zero-knowledge identity verification with a client-side
                    signature engine and event-driven Postgres indexer.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {["Rust", "TypeScript", "Docker"].map((tech) => (
                        <span
                            key={tech}
                            className="rounded-[var(--radius-sm)] border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-50)] px-2 py-1 text-[10px] font-medium text-[var(--ihi-surface-700)]"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
                <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--ihi-surface-50)] p-3 text-[10px] text-[var(--ihi-surface-500)]">
                    <span className="font-medium text-[var(--ihi-surface-700)]">
                        34% structure overlap
                    </span>{" "}
                    with the starter template. Core logic is distinct.
                </div>
            </div>
        </PreviewFrame>
    );
}

function SubmissionPreview() {
    return (
        <PreviewFrame title="Final submission">
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[var(--ihi-surface-900)]">
                            Project submission
                        </p>
                        <p className="mt-1 text-xs text-[var(--ihi-surface-500)]">
                            One final handoff, captured reliably.
                        </p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-[var(--ihi-signal-stop)]">
                        02:14:37
                    </p>
                </div>
                <div className="mt-5 space-y-3">
                    <div>
                        <p className="mb-1.5 text-[10px] font-medium text-[var(--ihi-surface-600)]">
                            Repository URL
                        </p>
                        <div className="rounded-[var(--radius-sm)] border border-[var(--ihi-surface-200)] px-3 py-2 text-xs text-[var(--ihi-surface-500)]">
                            github.com/signal-foundry/verify
                        </div>
                    </div>
                    <div>
                        <p className="mb-1.5 text-[10px] font-medium text-[var(--ihi-surface-600)]">
                            Demo link
                        </p>
                        <div className="rounded-[var(--radius-sm)] border border-[var(--ihi-surface-200)] px-3 py-2 text-xs text-[var(--ihi-surface-500)]">
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
        <div className="min-h-screen bg-[var(--ihi-surface-50)] text-[var(--ihi-surface-900)]">
            <header
                className={`sticky top-0 z-30 ${scrolled ? "border-b border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-50)]/90 backdrop-blur" : "bg-transparent"}`}
            >
                <nav
                    className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
                    aria-label="Primary navigation"
                >
                    <a
                        href="/"
                        className="flex items-center gap-2 font-semibold tracking-tight"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--ihi-brand-600)] text-xs font-bold text-white">
                            I
                        </span>
                        IHI
                    </a>
                    <div className="hidden items-center gap-6 text-sm text-[var(--ihi-surface-600)] md:flex">
                        <a href="#platform">Platform</a>
                        <a href="#scale">Scale</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <a
                        href="/team"
                        className="rounded-[var(--radius-md)] bg-[var(--ihi-brand-600)] px-3.5 py-2 text-sm font-medium text-white"
                    >
                        Enter workspace
                    </a>
                </nav>
            </header>

            <main>
                <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div className="ihi-reveal">
                        <p className="mb-5 font-mono text-xs text-[var(--ihi-surface-500)]">
                            Innovative Hack Intelligence
                        </p>
                        <h1 className="max-w-xl text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
                            The operating system for serious hackathons.
                        </h1>
                        <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--ihi-surface-600)]">
                            IHI gives organizers real-time control over the
                            entire event—from registration and team formation
                            through final submission and judging.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="/team"
                                className="rounded-[var(--radius-md)] bg-[var(--ihi-brand-600)] px-4 py-2.5 text-sm font-medium text-white"
                            >
                                Explore the workspace
                            </a>
                            <a
                                href="#platform"
                                className="rounded-[var(--radius-md)] border border-[var(--ihi-surface-300)] bg-[var(--ihi-surface-0)] px-4 py-2.5 text-sm font-medium text-[var(--ihi-surface-800)]"
                            >
                                See how it works
                            </a>
                        </div>
                    </div>
                    <div className="ihi-reveal lg:[transition-delay:120ms]">
                        <OperationsPreview />
                    </div>
                </section>

                <section className="border-y border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)]">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[var(--ihi-surface-200)] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
                        {[
                            ["1,500+", "participants supported"],
                            ["<200ms", "live data latency"],
                            ["99.9%", "submission capture rate"],
                        ].map(([value, label]) => (
                            <div
                                key={label}
                                className="py-6 text-center sm:py-8"
                            >
                                <p className="font-mono text-2xl font-semibold tracking-tight">
                                    {value}
                                </p>
                                <p className="mt-1 text-xs text-[var(--ihi-surface-500)]">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    id="platform"
                    className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
                >
                    <div className="ihi-reveal max-w-xl">
                        <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                            Built for the actual work of running an event.
                        </h2>
                        <p className="mt-4 leading-relaxed text-[var(--ihi-surface-600)]">
                            A calmer operating surface for organizers, and
                            clearer next steps for everyone participating.
                        </p>
                    </div>
                    <div className="mt-16 space-y-20 sm:space-y-28">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`ihi-reveal grid gap-10 lg:grid-cols-2 lg:items-center ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
                            >
                                <div>
                                    <h3 className="text-2xl font-bold tracking-[-0.025em]">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-4 max-w-md leading-relaxed text-[var(--ihi-surface-600)]">
                                        {feature.body}
                                    </p>
                                </div>
                                <div>{feature.preview}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    id="scale"
                    className="bg-[var(--ihi-surface-950)] text-[var(--ihi-surface-900)]"
                >
                    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
                        <div className="ihi-reveal max-w-xl">
                            <p className="font-mono text-xs text-[var(--ihi-surface-500)]">
                                DESIGNED TO SCALE
                            </p>
                            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                                One reliable system, even when the room gets
                                loud.
                            </h2>
                        </div>
                        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-200)] lg:grid-cols-4">
                            {[
                                ["1,500", "participants"],
                                ["300+", "teams"],
                                ["50", "judges"],
                                ["0", "manual exports"],
                            ].map(([value, label]) => (
                                <div
                                    key={label}
                                    className="ihi-reveal bg-[var(--ihi-surface-0)] p-5 sm:p-7"
                                >
                                    <p className="font-mono text-3xl font-semibold">
                                        {value}
                                    </p>
                                    <p className="mt-2 text-xs text-[var(--ihi-surface-500)]">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="contact"
                    className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28"
                >
                    <div className="ihi-reveal">
                        <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                            Run the event your ideas deserve.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[var(--ihi-surface-600)]">
                            Bring registration, collaboration, submissions, and
                            readiness into one dependable workspace.
                        </p>
                        <a
                            href="/team"
                            className="mt-8 inline-flex rounded-[var(--radius-md)] bg-[var(--ihi-brand-600)] px-4 py-2.5 text-sm font-medium text-white"
                        >
                            Start organizing with IHI
                        </a>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[var(--ihi-surface-200)]">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-xs text-[var(--ihi-surface-500)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <span>© 2026 IHI. Innovative Hack Intelligence.</span>
                    <span className="font-mono">
                        Built for high-stakes deadlines.
                    </span>
                </div>
            </footer>
        </div>
    );
}
