"use client";

import { Button, Card } from "@/components/ui";
import type { Team } from "@/types/shared";

export interface TeamCardData {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  skills: string[];
  isLooking: boolean;
}

interface Props {
  team: TeamCardData | Team;
  onJoin?: (id: string) => void;
  isMember?: boolean;
  joinDisabled?: boolean;
  onOpen?: (team: Team) => void;
  onRequestJoin?: (team: Team) => void;
}

export function TeamCard({ team, onJoin, isMember, joinDisabled, onOpen, onRequestJoin }: Props) {
  const displayTeam: TeamCardData = "memberCount" in team
    ? team
    : {
      id: team.id,
      name: team.name,
      memberCount: team.member_count,
      maxMembers: team.max_members,
      skills: team.skills_wanted,
      isLooking: team.status === "forming",
    };
  const full = displayTeam.memberCount >= displayTeam.maxMembers;

  return (
    <Card variant="interactive" className="p-4" onClick={() => "member_count" in team && onOpen?.(team)}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--ihi-surface-900)]">{displayTeam.name}</h3>
        <span
          className={`shrink-0 text-xs tabular-nums font-medium ${full ? "text-[var(--ihi-surface-400)]" : "text-[var(--ihi-signal-go)]"}`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {displayTeam.memberCount}/{displayTeam.maxMembers}
        </span>
      </div>
      {displayTeam.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {displayTeam.skills.map((skill) => (
            <span key={skill} className="rounded-[var(--radius-sm)] bg-[var(--ihi-surface-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ihi-surface-600)]">
              {skill}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4">
        {full ? (
          <Button variant="secondary" size="sm" className="w-full" disabled>Team full</Button>
        ) : (
          <Button variant={isMember ? "secondary" : "primary"} size="sm" className="w-full" disabled={joinDisabled} onClick={(event) => {
            event.stopPropagation();
            if ("member_count" in team) onRequestJoin?.(team);
            else onJoin?.(displayTeam.id);
          }}>
            {isMember ? "Open team" : displayTeam.isLooking ? "Request to join" : "View team"}
          </Button>
        )}
      </div>
    </Card>
  );
}
