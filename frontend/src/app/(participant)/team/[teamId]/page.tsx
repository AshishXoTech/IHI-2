"use client";

import { use, useState } from "react";
import { Button, Card, Input } from "@/components/ui";

const members = [
  { initials: "AM", name: "Aanya Mehta", role: "Frontend engineer", skills: ["React", "Systems"] },
  { initials: "SK", name: "Sana Khan", role: "Product lead", skills: ["Research", "Strategy"] },
  { initials: "JR", name: "Jon Reyes", role: "ML engineer", skills: ["Python", "Models"] },
];
const initialMessages = [
  { id: 1, author: "Aanya Mehta", initials: "AM", body: "I have the verification flow working against the test issuer.", time: "14:08", mine: false },
  { id: 2, author: "You", initials: "YO", body: "Great. I’ll turn the edge cases into a concise demo script.", time: "14:12", mine: true },
  { id: 3, author: "Sana Khan", initials: "SK", body: "I added the three user scenarios to our presentation outline.", time: "14:16", mine: false },
];

export default function TeamWorkspacePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const sendMessage = () => { if (!draft.trim()) return; setMessages((current) => [...current, { id: Date.now(), author: "You", initials: "YO", body: draft.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), mine: true }]); setDraft(""); };

  return (
    <main className="min-h-screen bg-[var(--ihi-surface-50)] px-5 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-6xl"><header className="border-b border-[var(--ihi-surface-200)] pb-7"><p className="text-sm text-[var(--ihi-surface-500)]">Spring Innovation Challenge <span className="mx-1.5">/</span> Teams <span className="mx-1.5">/</span> {teamId}</p><div className="mt-3 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Signal Foundry</h1><p className="mt-2 text-sm text-[var(--ihi-surface-600)]">Decentralized verification for community services.</p></div><p className="font-mono text-sm text-[var(--ihi-signal-go)]">3 / 4 members</p></div></header>
        <div className="mt-8 grid gap-6 lg:grid-cols-5"><aside className="lg:col-span-2"><Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Team members</h2><span className="font-mono text-xs text-[var(--ihi-surface-500)]">3/4</span></div><ul className="mt-5 space-y-5">{members.map((member) => <li key={member.name} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ihi-brand-100)] text-xs font-semibold text-[var(--ihi-brand-800)]">{member.initials}</span><div><p className="text-sm font-medium">{member.name}</p><p className="mt-0.5 text-xs text-[var(--ihi-surface-500)]">{member.role}</p><div className="mt-2 flex flex-wrap gap-1">{member.skills.map((skill) => <span key={skill} className="rounded-[var(--radius-sm)] bg-[var(--ihi-surface-100)] px-1.5 py-0.5 text-[10px] text-[var(--ihi-surface-600)]">{skill}</span>)}</div></div></li>)}</ul><div className="mt-6 rounded-[var(--radius-sm)] border border-dashed border-[var(--ihi-surface-300)] p-3"><p className="text-xs font-medium text-[var(--ihi-surface-700)]">One open slot</p><p className="mt-1 text-[10px] text-[var(--ihi-surface-500)]">Seeking a product-minded builder.</p></div></Card></aside>
          <section className="lg:col-span-3"><Card className="flex min-h-[510px] flex-col p-0"><div className="border-b border-[var(--ihi-surface-200)] px-5 py-4"><h2 className="text-sm font-semibold">Team chat</h2><p className="mt-1 text-xs text-[var(--ihi-surface-500)]">Messages update for everyone on your team.</p></div><div className="flex-1 space-y-4 p-5">{messages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.mine ? "justify-end" : ""}`}>{!message.mine && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ihi-surface-200)] text-[10px] font-semibold text-[var(--ihi-surface-700)]">{message.initials}</span>}<div className={`max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 ${message.mine ? "bg-[var(--ihi-brand-600)] text-white" : "bg-[var(--ihi-surface-100)] text-[var(--ihi-surface-800)]"}`}><p className="text-xs leading-relaxed">{message.body}</p><p className={`mt-1 font-mono text-[10px] ${message.mine ? "text-[var(--ihi-brand-100)]" : "text-[var(--ihi-surface-500)]"}`}>{message.author} · {message.time}</p></div></div>)}</div><div className="border-t border-[var(--ihi-surface-200)] p-4"><div className="flex gap-2"><Input aria-label="New team message" placeholder="Write a message…" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} /><Button onClick={sendMessage}>Send</Button></div></div></Card></section></div>
      </div>
    </main>
  );
}
