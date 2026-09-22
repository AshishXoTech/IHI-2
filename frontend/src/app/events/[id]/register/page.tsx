"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PublicRegistrationForm() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const supabase = createClient();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    skills: "TypeScript, React, Python",
  });

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .single();

      if (data) {
        setEvent(data);
      }
      setLoading(false);
    }
    loadEvent();
  }, [eventId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      router.push(`/login?next=/events/${eventId}/register`);
      return;
    }

    const { error } = await supabase.from("registrations").insert({
      event_id: event.id,
      user_id: userData.user.id,
      display_name: formData.displayName.trim() || userData.user.email,
      skills: formData.skills.split(",").map((s) => s.trim()),
      status: "approved",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    alert("Registration Successful!");
    router.push(`/team`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        Loading Registration Form...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        Event Not Found
      </div>
    );
  }

  const customFields: string[] = Array.isArray(event.registration_fields)
    ? event.registration_fields
    : [];

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12 text-stone-900">
      <div className="mx-auto max-w-lg rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Register for {event.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Fill in your details to join this hackathon.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-500">
              Display Name
            </label>
            <input
              type="text"
              required
              placeholder="Ada Lovelace"
              className="mt-1 w-full rounded-md border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-indigo-500 focus:outline-none"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-500">
              Skills (comma separated)
            </label>
            <input
              type="text"
              required
              placeholder="React, Python, Node.js"
              className="mt-1 w-full rounded-md border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-indigo-500 focus:outline-none"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>

          {customFields.map((field) => (
            <div key={field}>
              <label className="block text-xs font-semibold uppercase text-stone-500">
                {field}
              </label>
              <input
                type="text"
                placeholder={`Your ${field}`}
                className="mt-1 w-full rounded-md border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}