"use client";

import { use } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  StatusBadge,
} from "@/components/ui";

// ── 1. Mock Team Oversight Data ──────────────────────────────────
interface TeamOversightItem {
  id: string;
  name: string;
  lead: string;
  members: number;
  capacity: number;
  status: "good" | "attention" | "critical";
}

const MOCK_TEAMS_LIST: TeamOversightItem[] = [
  {
    id: "t1",
    name: "Team Quantum",
    lead: "Alex Kim",
    members: 4,
    capacity: 4,
    status: "good",
  },
  {
    id: "t2",
    name: "ByteForce",
    lead: "Marcus Vance",
    members: 3,
    capacity: 4,
    status: "attention",
  },
  {
    id: "t3",
    name: "Null Pointer",
    lead: "Dave Miller",
    members: 1,
    capacity: 4,
    status: "critical",
  },
];

// ── 2. Component ──────────────────────────────────────────────────
export default function OrganizerTeamsOversightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] text-[var(--ihi-surface-900)]">
      {/* Header */}
      <header className="border-b border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[var(--ihi-surface-900)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Team Formation Oversight
            </h1>
            <p className="mt-0.5 text-xs text-[var(--ihi-surface-500)]">
              Event ID: <span className="font-mono text-[var(--ihi-surface-700)]">{eventId}</span> &middot; Live Team Audit
            </p>
          </div>
        </div>
      </header>

      {/* Main Table */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Team Lead</TableHead>
              <TableHead>Members / Capacity</TableHead>
              <TableHead>Formation Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_TEAMS_LIST.map((team) => {
              const slotsOpen = team.capacity - team.members;
              const badgeLabel =
                slotsOpen === 0
                  ? "Full"
                  : `${slotsOpen} slot${slotsOpen > 1 ? "s" : ""} open`;

              return (
                <TableRow key={team.id}>
                  <TableCell className="font-semibold text-[var(--ihi-surface-900)]">
                    {team.name}
                  </TableCell>
                  <TableCell>{team.lead}</TableCell>
                  <TableCell
                    className="text-xs text-[var(--ihi-surface-800)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {team.members} / {team.capacity}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={team.status} label={badgeLabel} />
                  </TableCell>
                </TableRow>
              );
            })}

            {MOCK_TEAMS_LIST.length === 0 && (
              <TableEmpty colSpan={4}>No teams registered yet.</TableEmpty>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}