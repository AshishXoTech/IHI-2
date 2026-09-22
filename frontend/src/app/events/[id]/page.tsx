import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PublicEventLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-stone-900">
            IHI Platform
          </Link>
          <Link
            href={`/events/${event.slug || event.id}/register`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Register Now
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          {event.status.replace("_", " ")}
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          {event.name}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          {event.description || "Welcome to the hackathon event page."}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          <div>
            <span className="text-xs font-semibold uppercase text-stone-400">Start Date</span>
            <p className="mt-1 font-medium text-stone-900">
              {event.starts_at ? new Date(event.starts_at).toLocaleDateString() : "TBD"}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-stone-400">Max Team Size</span>
            <p className="mt-1 font-medium text-stone-900">{event.max_team_size} members</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-stone-400">Capacity</span>
            <p className="mt-1 font-medium text-stone-900">
              {event.max_participants ? `${event.max_participants} hackers` : "Unlimited"}
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={`/events/${event.slug || event.id}/register`}
            className="rounded-lg bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700"
          >
            Complete Registration →
          </Link>
        </div>
      </main>
    </div>
  );
}