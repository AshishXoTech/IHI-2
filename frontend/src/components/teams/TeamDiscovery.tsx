"use client";

import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { TeamCard } from "./TeamCard";
import { SkillFilter } from "./SkillFilter";
import type { Team } from "@/types/shared";
import { clsx } from "clsx";

// Usage: <TeamDiscovery teams={teams} myTeamId={id} onCreate={() => {}} onOpen={fn} onJoin={fn} />

interface TeamDiscoveryProps {
    teams: Team[];
    myTeamId?: string | null;
    onCreateClick?: () => void;
    onOpenTeam?: (teamId: string) => void;
    onJoinTeam?: (teamId: string) => void;
    className?: string;
}

export function TeamDiscovery({
    teams,
    myTeamId,
    onCreateClick,
    onOpenTeam,
    onJoinTeam,
    className,
}: TeamDiscoveryProps) {
    const [query, setQuery] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [hideFull, setHideFull] = useState(false);

    const allSkills = useMemo(() => {
        const set = new Set<string>();
        teams.forEach((t) => t.skills_wanted.forEach((s) => set.add(s)));
        return Array.from(set).sort();
    }, [teams]);

    const filtered = useMemo(() => {
        return teams.filter((t) => {
            if (
                hideFull &&
                (t.status === "full" || t.member_count >= t.max_members)
            )
                return false;
            if (query) {
                const q = query.toLowerCase();
                const hay =
                    `${t.name} ${t.description ?? ""} ${t.track ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (selectedSkills.length > 0) {
                if (!selectedSkills.some((s) => t.skills_wanted.includes(s)))
                    return false;
            }
            return true;
        });
    }, [teams, query, selectedSkills, hideFull]);

    return (
        <div className={clsx("flex flex-col gap-5", className)}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                        Find a team
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Browse open teams or start your own. Last-slot joins are
                        concurrency-safe.
                    </p>
                </div>
                {!myTeamId && (
                    <Button variant="primary" onClick={onCreateClick}>
                        Create a team
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <Input
                    label="Search teams"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, track, description…"
                />

                <SkillFilter
                    skills={allSkills}
                    selected={selectedSkills}
                    onChange={setSelectedSkills}
                />

                <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer w-fit">
                    <input
                        type="checkbox"
                        checked={hideFull}
                        onChange={(e) => setHideFull(e.target.checked)}
                        className="rounded border-[var(--border-default)] text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    />
                    Hide full teams
                </label>
            </div>

            {filtered.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-10 text-center">
                    No teams match your filters.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((team) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            isMember={team.id === myTeamId}
                            joinDisabled={Boolean(myTeamId)}
                            onOpen={
                                onOpenTeam
                                    ? () => onOpenTeam(team.id)
                                    : undefined
                            }
                            onRequestJoin={
                                onJoinTeam
                                    ? () => onJoinTeam(team.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}