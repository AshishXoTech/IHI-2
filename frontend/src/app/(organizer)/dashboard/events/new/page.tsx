"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Static initial values — guarantees zero hydration mismatch and zero loading delay
  const [name, setName] = useState("Spring Innovation Challenge 2026");
  const [slug, setSlug] = useState("spring-challenge-2026");
  const [description, setDescription] = useState("Premier AI and software engineering hackathon.");
  const [startsAt, setStartsAt] = useState("2026-04-01T09:00");
  const [endsAt, setEndsAt] = useState("2026-04-03T18:00");
  const [submissionDeadline, setSubmissionDeadline] = useState("2026-04-03T12:00");
  const [maxParticipants, setMaxParticipants] = useState("250");
  const [maxTeamSize, setMaxTeamSize] = useState("4");
  const [customFields, setCustomFields] = useState<string[]>(["GitHub Repository", "Dietary Restrictions"]);
  const [newField, setNewField] = useState("");

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");

  const handleNext = () => {
    setErrorMessage(null);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const addCustomField = () => {
    if (newField.trim() && !customFields.includes(newField.trim())) {
      setCustomFields([...customFields, newField.trim()]);
      setNewField("");
    }
  };

  const removeCustomField = (fieldToRemove: string) => {
    setCustomFields(customFields.filter((f) => f !== fieldToRemove));
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name,
      slug,
      description,
      startsAt,
      endsAt,
      submissionDeadline,
      maxParticipants,
      maxTeamSize,
      customFields,
    };

    try {
      const res = await fetch("/api/events/new/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        setErrorMessage(result.error || "Failed to publish event.");
        setIsSubmitting(false);
        return;
      }

      alert("Event Published Successfully!");
      router.push(`/events/${result.data.slug || result.data.id}`);
    } catch {
      setErrorMessage("Network error connecting to publish API.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Organizer Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Create New Event
          </h1>

          {/* Interactive Step Progress Bars */}
          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-2.5 flex-1 rounded-full transition-all cursor-pointer ${
                  step >= i ? "bg-white" : "bg-neutral-800 hover:bg-neutral-700"
                }`}
              />
            ))}
          </div>

          {/* Step Navigation Tabs */}
          <div className="mt-3 flex justify-between font-mono text-xs uppercase tracking-widest text-neutral-400">
            {[
              { num: 1, label: "1. Basics" },
              { num: 2, label: "2. Format" },
              { num: 3, label: "3. Registration" },
              { num: 4, label: "4. Review" },
            ].map((tab) => (
              <button
                key={tab.num}
                type="button"
                onClick={() => setStep(tab.num)}
                className={`cursor-pointer px-2 py-1 hover:text-white ${
                  step === tab.num ? "text-white font-bold underline" : ""
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="rounded-xl border border-white/20 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Step 1: Event Basics</h2>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Event Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  URL Slug
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 font-mono text-sm text-white focus:border-white focus:outline-none"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="mt-1 font-mono text-[10px] text-neutral-500">
                  Public URL: /events/{slug || "your-slug"}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: FORMAT & DATES */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Step 2: Format & Timeline</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Event Starts At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Event Ends At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Submission Lock Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REGISTRATION RULES */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Step 3: Registration Fields</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add custom field (e.g. Portfolio Link)"
                  className="flex-1 rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-black hover:bg-neutral-200 cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-black p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Configured Registration Fields
                </p>
                <div className="rounded border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
                  Name & Email (Default Required)
                </div>
                {customFields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between rounded border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <span>{field}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field)}
                      className="text-xs text-red-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Step 4: Review & Publish Event</h2>
              <div className="rounded-lg border border-white/15 bg-black p-5 text-sm space-y-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Title & Slug
                  </span>
                  <p className="text-base font-semibold text-white">
                    {name} (/events/{slug})
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Timeline
                  </span>
                  <p className="text-xs text-neutral-300">Starts: {startsAt}</p>
                  <p className="text-xs text-neutral-300">Ends: {endsAt}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Custom Registration Fields
                  </span>
                  <p className="text-xs text-neutral-300">
                    {customFields.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
            >
              ← Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-black hover:bg-neutral-200 cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-black hover:bg-neutral-200 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Publishing..." : "Publish Event Live"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}