"use client";

import { Button, Card, StatusBadge } from "@/components/ui";
import { TeamMemberList } from "./TeamMemberList";
import { TeamChat } from "./TeamChat";
import type { Team, TeamMember, TeamChatMessage } from "@/types/shared";
import { clsx } from "clsx";

// Usage: <TeamWorkspace team={t} members={m} messages={msg} currentUserId={uid} onLeave={fn} />

interface TeamWorkspaceProps {
  team: Team;
  members: TeamMember[];
  messages?: TeamChatMessage[];
  currentUserId: string;
  onLeave?: () => void;
  leaving?: boolean;
  className?: string;
}

export function TeamWorkspace({
  team,
  members,
  messages = [],
  currentUserId,
  onLeave,
  leaving,
  className,
}: TeamWorkspaceProps) {
  const isLead = members.some(
    (m) => m.user_id === currentUserId && m.role === "lead"
  );

  return (
    <div className={clsx("flex flex-col gap-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {team.name}
            </h1>
            <StatusBadge
              status={
                team.status === "full"
                  ? "attention"
                  : team.status === "locked"
                    ? "critical"
                    : "good"
              }
              label={
                team.status === "forming"
                  ? "Forming"
                  : team.status === "full"
                    ? "Full"
                    : "Locked"
              }
            />
          </div>
          {team.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              {team.description}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-1 tabular-nums">
            {team.member_count}/{team.max_members} members
            {team.track ? ` · ${team.track}` : ""}
            {isLead ? " · You are team lead" : ""}
          </p>
        </div>

        {onLeave && (
          <Button
            variant="destructive"
            size="sm"
            loading={leaving}
            onClick={onLeave}
          >
            Leave team
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card padding="md" className="h-fit">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Members
          </h2>
          <TeamMemberList members={members} currentUserId={currentUserId} />
        </Card>

        <TeamChat
          teamId={team.id}
          currentUserId={currentUserId}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}