"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { ApiResult, Team } from "@/types/shared";

// Usage: <JoinRequestButton team={team} onJoined={fn} onFull={fn} />
// Hits POST /api/teams/[id]/join — server enforces concurrency safety.

interface JoinRequestButtonProps {
  team: Team;
  message?: string;
  onJoined?: (memberCount: number) => void;
  onFull?: () => void;
  onError?: (message: string) => void;
  size?: "sm" | "md" | "lg";
}

export function JoinRequestButton({
  team,
  message,
  onJoined,
  onFull,
  onError,
  size = "sm",
}: JoinRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const isFull =
    team.status === "full" || team.member_count >= team.max_members;

  async function handleJoin() {
    if (isFull || loading || done) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/teams/${team.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || null }),
      });
      const json: ApiResult<{ member_count: number; team_status: string }> =
        await res.json();

      if (!json.ok) {
        if (json.code === "team_full") {
          onFull?.();
          onError?.("This team just filled up — that last spot was taken.");
        } else if (json.code === "already_on_team") {
          onError?.("You're already on a team for this event.");
        } else {
          onError?.(json.error || "Could not join team.");
        }
        return;
      }

      setDone(true);
      onJoined?.(json.data.member_count);
    } catch {
      onError?.("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Button variant="secondary" size={size} disabled>
        Joined
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      loading={loading}
      disabled={isFull}
      onClick={handleJoin}
    >
      {isFull ? "Team full" : "Request to join"}
    </Button>
  );
}