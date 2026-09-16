"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui";

const initialDeadline = Date.now() + (3 * 60 * 60 + 42 * 60) * 1000;
const formatRemaining = (milliseconds: number) => {
  if (milliseconds <= 0) return "00:00:00";
  const seconds = Math.floor(milliseconds / 1000);
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((part) => String(part).padStart(2, "0")).join(":");
};

export default function SubmitProjectPage() {
  const [remaining, setRemaining] = useState(initialDeadline - Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: "", tagline: "", description: "", repository: "", demo: "" });
  const locked = remaining <= 0;

  useEffect(() => {
    const interval = window.setInterval(() => setRemaining(initialDeadline - Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-[var(--ihi-surface-50)] px-5"><Card variant="elevated" className="max-w-md p-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ihi-signal-go-bg)] text-xl text-[var(--ihi-signal-go)]">✓</span><h1 className="mt-5 text-2xl font-bold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Submission received</h1><p className="mt-3 text-sm leading-relaxed text-[var(--ihi-surface-600)]">Your project has been finalized and is ready for review. You can return to your team workspace while judging begins.</p><Button className="mt-6">Return to workspace</Button></Card></main>;

  return (
    <main className="min-h-screen bg-[var(--ihi-surface-50)] px-5 py-10 text-[var(--ihi-surface-900)] sm:px-8"><div className="mx-auto max-w-3xl"><header className="flex flex-col gap-4 border-b border-[var(--ihi-surface-200)] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[var(--ihi-surface-500)]">Spring Innovation Challenge</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Submit Project</h1><p className="mt-2 text-sm text-[var(--ihi-surface-600)]">Signal Foundry · Final submission</p></div><div className={`rounded-[var(--radius-md)] px-3 py-2 ${locked ? "bg-[var(--ihi-signal-stop-bg)] text-[var(--ihi-signal-stop)]" : "bg-[var(--ihi-surface-100)] text-[var(--ihi-surface-800)]"}`}><p className="text-[10px] font-medium">TIME REMAINING</p><p className="mt-0.5 font-mono text-xl font-semibold">{formatRemaining(remaining)}</p></div></header>
      {locked && <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--ihi-signal-stop)] bg-[var(--ihi-signal-stop-bg)] p-4 text-sm text-[var(--ihi-signal-stop)]">The submission deadline has passed. This form is now locked.</div>}
      <Card className="mt-7 p-5 sm:p-7"><div className="flex items-center justify-between border-b border-[var(--ihi-surface-200)] pb-5"><div><h2 className="text-lg font-semibold">Project details</h2><p className="mt-1 text-xs text-[var(--ihi-surface-500)]">Give judges the links and context they need.</p></div><span className="text-xs text-[var(--ihi-surface-500)]">{saved ? "Draft saved" : "Autosaves locally"}</span></div><form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); if (!locked) setSubmitted(true); }}><Input label="Project title" placeholder="e.g. Signal Foundry" value={form.title} disabled={locked} onChange={(event) => update("title", event.target.value)} /><Input label="One-line tagline" placeholder="What does your project make possible?" value={form.tagline} disabled={locked} onChange={(event) => update("tagline", event.target.value)} /><label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-[var(--ihi-surface-600)]">Project description</span><textarea value={form.description} disabled={locked} onChange={(event) => update("description", event.target.value)} placeholder="Explain the problem, your approach, and what is ready to demo." rows={5} className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] px-3 py-2.5 text-sm text-[var(--ihi-surface-900)] placeholder:text-[var(--ihi-surface-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ihi-brand-500)] disabled:pointer-events-none disabled:opacity-40" /></label><Input label="Repository URL" type="url" placeholder="https://github.com/your-team/project" value={form.repository} disabled={locked} onChange={(event) => update("repository", event.target.value)} /><Input label="Demo URL" type="url" placeholder="https://your-project.example" value={form.demo} disabled={locked} onChange={(event) => update("demo", event.target.value)} /><div className="flex flex-col-reverse gap-3 border-t border-[var(--ihi-surface-200)] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={locked} onClick={() => setSaved(true)}>Save Draft</Button><Button type="submit" disabled={locked}>Finalize & Submit</Button></div></form></Card>
    </div></main>
  );
}
