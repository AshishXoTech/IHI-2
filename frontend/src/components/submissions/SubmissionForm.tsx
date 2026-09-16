"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Input, Button, Card, StatusBadge } from "@/components/ui";
import { CountdownTimer } from "./CountdownTimer";
import type { Submission, SubmissionPayload } from "./types";

interface SubmissionFormProps {
  eventId: string;
  teamId: string;
  deadlineIso: string;
  initialData?: Submission | null;
}

type SaveState = "idle" | "saving" | "saved" | "error" | "locked";

export function SubmissionForm({ eventId, teamId, deadlineIso, initialData }: SubmissionFormProps) {
  const [data, setData] = useState<SubmissionPayload>({
    repo_url: initialData?.repo_url || "",
    demo_url: initialData?.demo_url || "",
    description: initialData?.description || "",
    is_draft: initialData?.is_draft ?? true,
  });

  const [lastSavedData, setLastSavedData] = useState<SubmissionPayload>(data);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<{ repo_url?: string; demo_url?: string }>({});
  const [locked, setLocked] = useState(false);

  const abortController = useRef<AbortController | null>(null);

  // Form Validation
  const validate = (payload: SubmissionPayload) => {
    const errs: { repo_url?: string; demo_url?: string } = {};
    const urlPattern = /^https?:\/\//;

    if (payload.repo_url && !urlPattern.test(payload.repo_url)) {
      errs.repo_url = "Must be a valid URL starting with http:// or https://";
    } else if (payload.repo_url && !payload.repo_url.includes("github.com") && !payload.repo_url.includes("gitlab.com")) {
      errs.repo_url = "Recommendation: usually a GitHub or GitLab link."; // Soft hint, not a block
    }

    if (payload.demo_url && !urlPattern.test(payload.demo_url)) {
      errs.demo_url = "Must be a valid URL starting with http:// or https://";
    }
    
    setErrors(errs);
    return Object.keys(errs).filter(k => errs[k as keyof typeof errs] !== "Recommendation: usually a GitHub or GitLab link.").length === 0;
  };

  const save = useCallback(async (payload: SubmissionPayload, isManualSubmit = false) => {
    if (locked) return;
    if (!validate(payload)) return;

    setSaveState("saving");
    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, team_id: teamId, ...payload }),
        signal: abortController.current.signal,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 403) {
          setLocked(true);
          setSaveState("locked");
        } else {
          setSaveState("error");
        }
        return;
      }

      setLastSavedData(payload);
      setSaveState(payload.is_draft ? "saved" : "idle");
    } catch (err: any) {
      if (err.name !== "AbortError") setSaveState("error");
    }
  }, [eventId, teamId, locked]);

  // Debounced Autosave
  useEffect(() => {
    const isDirty = JSON.stringify(data) !== JSON.stringify(lastSavedData);
    if (!isDirty || locked || !data.is_draft) return;

    const timer = setTimeout(() => save(data), 1500);
    return () => clearTimeout(timer);
  }, [data, lastSavedData, locked, save]);

  const handleFinalSubmit = () => {
    const finalData = { ...data, is_draft: false };
    setData(finalData);
    save(finalData, true);
  };

  return (
    <Card padding="lg" className="flex flex-col gap-6 max-w-2xl border-t-4 border-t-[var(--accent)]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Project Submission</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Work is autosaved locally. Finalize submission before the deadline.
          </p>
        </div>
        <CountdownTimer deadlineIso={deadlineIso} onExpire={() => setLocked(true)} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-muted)]">Status:</span>
        {locked ? (
          <StatusBadge status="critical" label="Locked (Deadline Passed)" />
        ) : !data.is_draft ? (
          <StatusBadge status="good" label="Submitted" />
        ) : (
          <StatusBadge status="attention" label="Draft" />
        )}

        {saveState === "saving" && <span className="ml-auto text-xs text-[var(--text-muted)] animate-pulse">Saving...</span>}
        {saveState === "saved" && <span className="ml-auto text-xs text-[var(--signal-good)]">All changes saved</span>}
        {saveState === "error" && <span className="ml-auto text-xs text-[var(--destructive)]">Failed to save</span>}
      </div>

      <div className="flex flex-col gap-5">
        <Input
          label="Repository URL"
          placeholder="https://github.com/your-team/repo"
          value={data.repo_url || ""}
          onChange={(e) => setData({ ...data, repo_url: e.target.value, is_draft: true })}
          disabled={locked}
          error={errors.repo_url?.includes("Must") ? errors.repo_url : undefined}
          hint={errors.repo_url?.includes("Recommendation") ? errors.repo_url : undefined}
        />

        <Input
          label="Demo Video / Pitch URL"
          placeholder="https://youtube.com/..."
          value={data.demo_url || ""}
          onChange={(e) => setData({ ...data, demo_url: e.target.value, is_draft: true })}
          disabled={locked}
          error={errors.demo_url}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">Project Description</label>
          <textarea
            rows={5}
            placeholder="What does it do? How did you build it?"
            value={data.description || ""}
            onChange={(e) => setData({ ...data, description: e.target.value, is_draft: true })}
            disabled={locked}
            className="w-full rounded-md px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 resize-none transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
        {locked ? (
          <Button disabled variant="secondary">Submissions Closed</Button>
        ) : !data.is_draft ? (
          <Button variant="secondary" onClick={() => setData({ ...data, is_draft: true })}>
            Edit Submission
          </Button>
        ) : (
          <Button variant="primary" onClick={handleFinalSubmit} loading={saveState === "saving"}>
            Submit Final Project
          </Button>
        )}
      </div>
    </Card>
  );
}