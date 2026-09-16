"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { TeamCard, type TeamCardData } from "@/components/teams/TeamCard";

const skills = ["All skills", "Product", "Design", "Frontend", "Backend", "Data", "AI/ML", "Pitching"];
const teams: TeamCardData[] = [
  { id: "signal-foundry", name: "Signal Foundry", memberCount: 3, maxMembers: 4, skills: ["Frontend", "AI/ML"], isLooking: true },
  { id: "civic-loop", name: "Civic Loop", memberCount: 2, maxMembers: 4, skills: ["Product", "Backend"], isLooking: true },
  { id: "orbit-ledger", name: "Orbit Ledger", memberCount: 4, maxMembers: 4, skills: ["Data", "Pitching"], isLooking: false },
  { id: "field-note", name: "Field Note", memberCount: 3, maxMembers: 5, skills: ["Design", "Frontend"], isLooking: true },
];
const soloParticipants = [
  { initials: "NK", name: "Nila Kapoor", skill: "Product strategy" },
  { initials: "RS", name: "Rohan Shah", skill: "Data engineering" },
  { initials: "JM", name: "Jules Martin", skill: "Visual design" },
];

export default function TeamDiscoveryPage() {
  const [selectedSkill, setSelectedSkill] = useState("All skills");
  const [requestedTeam, setRequestedTeam] = useState<string | null>(null);
  const visibleTeams = useMemo(() => selectedSkill === "All skills" ? teams : teams.filter((team) => team.skills.includes(selectedSkill)), [selectedSkill]);

  return (
    <main className="min-h-screen bg-[var(--ihi-surface-50)] px-5 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-5 border-b border-[var(--ihi-surface-200)] pb-7 sm:flex-row sm:items-end">
          <div><p className="text-sm text-[var(--ihi-surface-500)]">Spring Innovation Challenge</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Find your team</h1><p className="mt-2 text-sm text-[var(--ihi-surface-600)]">Join a team with room for your strengths, or start the one you need.</p></div>
          <div className="flex gap-5 text-sm"><p><span className="font-mono font-semibold">{teams.length}</span> <span className="text-[var(--ihi-surface-500)]">teams</span></p><p><span className="font-mono font-semibold">{soloParticipants.length}</span> <span className="text-[var(--ihi-surface-500)]">looking</span></p></div>
        </header>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-2" aria-label="Filter teams by skill">
          {skills.map((skill) => <button key={skill} type="button" onClick={() => setSelectedSkill(skill)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${selectedSkill === skill ? "bg-[var(--ihi-brand-600)] text-white" : "border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] text-[var(--ihi-surface-600)]"}`}>{skill}</button>)}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <section><div className="grid gap-4 sm:grid-cols-2">{visibleTeams.map((team) => <TeamCard key={team.id} team={team} onJoin={(id) => setRequestedTeam(id)} />)}</div>{requestedTeam && <p className="mt-4 text-sm text-[var(--ihi-signal-go)]">Join request sent to {teams.find((team) => team.id === requestedTeam)?.name}.</p>}</section>
          <aside className="space-y-4"><Card className="p-5"><p className="text-sm font-semibold">Still looking</p><p className="mt-1 text-xs text-[var(--ihi-surface-500)]">Connect with participants who have not found a team yet.</p><ul className="mt-4 space-y-4">{soloParticipants.map((person) => <li key={person.name} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ihi-surface-200)] text-[10px] font-semibold text-[var(--ihi-surface-700)]">{person.initials}</span><div><p className="text-xs font-medium">{person.name}</p><p className="text-[10px] text-[var(--ihi-surface-500)]">{person.skill}</p></div></li>)}</ul></Card><Card className="border-[var(--ihi-brand-200)] bg-[var(--ihi-brand-50)] p-5"><p className="text-sm font-semibold">Can&apos;t find the right fit?</p><p className="mt-2 text-xs leading-relaxed text-[var(--ihi-surface-600)]">Create a team and make the open role clear to the room.</p><Button size="sm" className="mt-4 w-full">Create a team</Button></Card></aside>
        </div>
      </div>
    </main>
  );
}
