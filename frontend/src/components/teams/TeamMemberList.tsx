"use client";

import { StatusBadge } from "@/components/ui";
import type { TeamMember } from "@/types/shared";
import { clsx } from "clsx";

// Usage: <TeamMemberList members={members} currentUserId={uid} />

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId?: string;
  className?: string;
}

export function TeamMemberList({
  members,
  currentUserId,
  className,
}: TeamMemberListProps) {
  const sorted = [...members].sort((a, b) => {
    if (a.role === "lead" && b.role !== "lead") return -1;
    if (b.role === "lead" && a.role !== "lead") return 1;
    return a.joined_at.localeCompare(b.joined_at);
  });

  return (
    <ul className={clsx("flex flex-col gap-2", className)} role="list">
      {sorted.map((m) => {
        const isYou = m.user_id === currentUserId;
        return (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {m.display_name}
                {isYou && (
                  <span className="ml-1.5 text-xs text-[var(--text-muted)]">(you)</span>
                )}
              </p>
              {m.skills.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {m.skills.join(" · ")}
                </p>
              )}
            </div>
            {m.role === "lead" ? (
              <StatusBadge status="good" label="Lead" />
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Member</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}