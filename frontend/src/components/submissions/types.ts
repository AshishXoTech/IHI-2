/**
 * Local types for Submissions.
 * TODO: Move these to frontend/src/types/shared.ts once Dev A syncs.
 */
export interface Submission {
    id: string;
    event_id: string;
    team_id: string;
    repo_url: string | null;
    demo_url: string | null;
    description: string | null;
    is_draft: boolean;
    excluded_from_gallery: boolean;
    updated_at: string;
}

export interface SubmissionPayload {
    repo_url: string | null;
    demo_url: string | null;
    description: string | null;
    is_draft: boolean;
}
