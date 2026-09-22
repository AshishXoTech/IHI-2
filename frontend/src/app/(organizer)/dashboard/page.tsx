import React from "react";
import Link from "next/link";

export default function OrganizerDashboardHome() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-white/15 bg-neutral-950 p-8 shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          Organizer Hub
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Organizer Command Center
        </h1>
        <p className="text-sm text-neutral-400">
          Your account is authenticated. Choose an action below:
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/dashboard/events/new"
            className="rounded-lg bg-white py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            + Create New Event
          </Link>
          <Link
            href="/events/spring-challenge-2026/registrations"
            className="rounded-lg border border-white/20 bg-neutral-900 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Review Registrations →
          </Link>
        </div>
      </div>
    </div>
  );
}