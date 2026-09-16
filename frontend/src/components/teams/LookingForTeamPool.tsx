"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { SkillFilter } from "./SkillFilter";
import type { SoloParticipant } from "@/types/shared";
import { clsx } from "clsx";

// Usage: <LookingForTeamPool participants={list} />

interface LookingForTeamPoolProps {
  participants: SoloParticipant[];
  className?: string;
}

export function LookingForTeamPool({
  participants,
  className,
}: LookingForTeamPoolProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => p.skills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [participants]);

  const filtered = useMemo(() => {
    if (selectedSkills.length === 0) return participants;
    return participants.filter((p) =>
      selectedSkills.some((s) => p.skills.includes(s))
    );
  }, [participants, selectedSkills]);

  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Looking for a team
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Solo participants still unmatched. Filter by skill to find a fit.
        </p>
      </div>

      <SkillFilter
        skills={allSkills}
        selected={selectedSkills}
        onChange={setSelectedSkills}
      />

      {filtered.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-[var(--text-muted)] text-center">
            {participants.length === 0
              ? "Everyone is on a team — pool is empty."
              : "No solo participants match those skills."}
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {filtered.map((p) => (
            <li key={p.user_id}>
              <Card padding="md" className="flex flex-col gap-2 h-full">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {p.display_name}
                  </p>
                  <time className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                    since{" "}
                    {new Date(p.looking_since).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {p.bio && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {p.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {p.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-[var(--surface-bg)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)] border border-[var(--border-default)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}