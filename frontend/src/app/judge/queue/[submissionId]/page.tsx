"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, StatusBadge } from "@/components/ui";
import type { ApiResult, CriterionScoreInput, RubricCriterion, Score } from "@/types/shared";

const DEFAULT_FALLBACK_CRITERIA: RubricCriterion[] = [
  { id: "fallback-1", title: "Technical Complexity", description: "Architecture, code quality, and technical depth", max_score: 10, weight: 30 },
  { id: "fallback-2", title: "Originality & Innovation", description: "Uniqueness of idea and creative execution", max_score: 10, weight: 25 },
  { id: "fallback-3", title: "Design & User Experience", description: "UI polish, responsiveness, and usability", max_score: 10, weight: 25 },
  { id: "fallback-4", title: "Impact & Utility", description: "Practical application and real-world value", max_score: 10, weight: 20 },
];

export default function JudgeScoringScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const submissionId = params.submissionId as string;
  const eventId = searchParams.get("eventId") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data
  const [submission, setSubmission] = useState<any>(null);
  const [criteria, setCriteria] = useState<RubricCriterion[]>(DEFAULT_FALLBACK_CRITERIA);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingScore, setExistingScore] = useState<Score | null>(null);

  // Correction Flow Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [proposedScores, setProposedScores] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load Queue status to check submission metadata and if already scored
      const queueRes = await fetch("/api/judging/queue");
      const queueJson = await queueRes.json();
      
      let matchedItem: any = null;
      if (queueRes.ok && queueJson.ok && Array.isArray(queueJson.data)) {
        matchedItem = queueJson.data.find((item: any) => item.submission_id === submissionId);
        if (matchedItem?.score) {
          setExistingScore(matchedItem.score);
        }
      }

      setSubmission({
        id: submissionId,
        title: matchedItem?.project_title || "Signal ZK Engine",
        description: "Zero-knowledge identity verification platform with client-side signature engine and event-driven indexer.",
        repo_url: "https://github.com/signal-foundry/verify",
        demo_url: "https://verify.signalfoundry.dev",
      });

      // 2. Load Active Rubric
      const rubricRes = await fetch(`/api/judging/rubric?eventId=${eventId}`);
      const rubricJson = await rubricRes.json();
      
      let activeCriteria = DEFAULT_FALLBACK_CRITERIA;
      if (rubricRes.ok && rubricJson.ok && rubricJson.data?.criteria && rubricJson.data.criteria.length > 0) {
        activeCriteria = rubricJson.data.criteria;
      }
      
      setCriteria(activeCriteria);

      // Initialize scores map
      const initialScores: Record<string, number> = {};
      activeCriteria.forEach((c) => {
        const key = c.id || c.title;
        initialScores[key] = Math.floor(c.max_score / 2);
      });
      setScores(initialScores);
      setProposedScores(initialScores);
    } catch {
      setErrorMessage("Error loading scoring workspace.");
    } finally {
      setLoading(false);
    }
  }, [eventId, submissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScoreSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const payloadCriteria: CriterionScoreInput[] = criteria.map((c) => {
      const key = c.id || c.title;
      return {
        criterion_id: key,
        title: c.title,
        score: Number(scores[key] ?? Math.floor(c.max_score / 2)),
        max_score: c.max_score,
        weight: c.weight,
      };
    });

    setSubmitting(true);

    try {
      const res = await fetch("/api/judging/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, submissionId, criteriaScores: payloadCriteria }),
      });

      const json: ApiResult<Score> = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMessage(!json.ok ? json.error : "Failed to submit score.");
        setSubmitting(false);
        return;
      }

      setExistingScore(json.data);
      setSuccessMessage("Score submitted successfully! Viewing read-only summary.");
      setSubmitting(false);
    } catch {
      setErrorMessage("Network error submitting score.");
      setSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    setErrorMessage(null);

    if (reason.trim().length < 20) {
      setErrorMessage("Correction reason must be at least 20 characters long.");
      return;
    }

    const payloadProposed: CriterionScoreInput[] = criteria.map((c) => {
      const key = c.id || c.title;
      return {
        criterion_id: key,
        title: c.title,
        score: Number(proposedScores[key] ?? Math.floor(c.max_score / 2)),
        max_score: c.max_score,
        weight: c.weight,
      };
    });

    setSubmitting(true);

    try {
      const res = await fetch("/api/judging/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          submissionId,
          originalScoreId: existingScore?.id,
          proposedCriteriaScores: payloadProposed,
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMessage(!json.ok ? json.error : "Failed to request correction.");
        setSubmitting(false);
        return;
      }

      alert("Correction request submitted for organizer review!");
      setShowCorrectionModal(false);
      setSubmitting(false);
      router.push("/judge/queue");
    } catch {
      setErrorMessage("Network error submitting correction request.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-neutral-500">Loading scoring workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <Link href="/judge/queue" className="text-xs text-neutral-400 hover:text-white underline">
              ← Back to Queue
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              {submission?.title || "Submission Evaluation"}
            </h1>
          </div>

          <StatusBadge
            status={existingScore ? "good" : "attention"}
            label={existingScore ? "Read-Only / Scored" : "Scoring Active"}
          />
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* FLAGSHIP SPLIT SCREEN LAYOUT */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT SIDE: SUBMISSION CONTENT & AI BRIEFING PLACEHOLDER */}
          <div className="space-y-6">
            <Card padding="lg" variant="default" className="bg-neutral-950 border-white/15 space-y-4">
              <h2 className="text-lg font-semibold text-white">Project Details</h2>
              <p className="text-sm leading-relaxed text-neutral-300">{submission?.description}</p>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Repository</span>
                  <a
                    href={submission?.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-mono text-xs text-indigo-400 hover:underline"
                  >
                    {submission?.repo_url}
                  </a>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Demo URL</span>
                  <a
                    href={submission?.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-mono text-xs text-indigo-400 hover:underline"
                  >
                    {submission?.demo_url}
                  </a>
                </div>
              </div>
            </Card>

            {/* INTEGRATION POINT — Dev 2's AI Judge Briefing panel goes here.
                Expected prop: submissionId. Do not build this panel yourself. */}
            {/* <AIBriefingPanel submissionId={submission.id} /> */}
          </div>

          {/* RIGHT SIDE: RUBRIC-DRIVEN FORM OR READ-ONLY SUMMARY */}
          <div>
            {existingScore ? (
              /* READ-ONLY SUMMARY VIEW (IMMUTABLE SCORE) */
              <Card padding="lg" variant="default" className="bg-neutral-950 border-white/15 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Submitted Score Summary</h2>
                    <p className="text-xs text-neutral-500">Submitted on {new Date(existingScore.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase text-neutral-500">Total Weighted</span>
                    <p className="font-mono text-2xl font-bold text-emerald-400">{existingScore.total_score}%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {existingScore.criteria_scores?.map((cs, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-white/10 bg-black p-3 text-sm">
                      <div>
                        <p className="font-medium text-white">{cs.title}</p>
                        <p className="font-mono text-[10px] text-neutral-500">Weight: {cs.weight}%</p>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white">
                        {cs.score} / {cs.max_score}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <Button variant="secondary" onClick={() => setShowCorrectionModal(true)} className="w-full">
                    Request Score Correction
                  </Button>
                </div>
              </Card>
            ) : (
              /* ACTIVE EDITABLE SCORING FORM (INSERT-ONLY) */
              <Card padding="lg" variant="default" className="bg-neutral-950 border-white/15 space-y-6">
                <h2 className="text-lg font-semibold text-white">Rubric Evaluation Form</h2>

                <div className="space-y-5">
                  {criteria.map((c) => {
                    const key = c.id || c.title;
                    const val = scores[key] ?? Math.floor(c.max_score / 2);
                    return (
                      <div key={key} className="space-y-2 rounded-lg border border-white/10 bg-black p-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-white">{c.title}</label>
                          <span className="font-mono text-xs text-neutral-400">Weight: {c.weight}%</span>
                        </div>
                        {c.description && <p className="text-xs text-neutral-500">{c.description}</p>}

                        <div className="flex items-center gap-4 pt-2">
                          <input
                            type="range"
                            min="0"
                            max={c.max_score}
                            value={val}
                            onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                            className="flex-1 accent-white"
                          />
                          <span className="font-mono text-sm font-bold text-white w-12 text-right">
                            {val} / {c.max_score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="primary" onClick={handleScoreSubmit} loading={submitting} className="w-full">
                  Submit Final Score
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* CORRECTION REQUEST MODAL */}
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-white/20 bg-neutral-950 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Request Score Correction</h3>
              <p className="text-xs text-neutral-400">
                Submitted scores are immutable. Requesting a correction creates a pending review for organizers.
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {criteria.map((c) => {
                  const key = c.id || c.title;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                      <span className="text-white">{c.title}</span>
                      <input
                        type="number"
                        min="0"
                        max={c.max_score}
                        value={proposedScores[key] ?? 0}
                        onChange={(e) => setProposedScores({ ...proposedScores, [key]: Number(e.target.value) })}
                        className="w-16 rounded border border-white/20 bg-black px-2 py-1 font-mono text-white text-right"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-neutral-400 mb-1">
                  Reason for Correction * (Min 20 Chars)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this score needs adjustment (minimum 20 characters)..."
                  className="w-full rounded border border-white/20 bg-black p-2.5 text-xs text-white focus:border-white focus:outline-none"
                />
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Length: {reason.trim().length} / 20 characters minimum
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowCorrectionModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCorrectionSubmit}
                  loading={submitting}
                  disabled={reason.trim().length < 20}
                >
                  Submit Correction Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}