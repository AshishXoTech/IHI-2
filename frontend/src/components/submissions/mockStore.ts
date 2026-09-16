/**
 * Isolated mock store for Submissions to avoid editing Dev A's files.
 */
import { MOCK_EVENT_ID } from "@/lib/mocks/teams";
import type { Submission } from "@/components/submissions/types";

// Mock deadline: 1 hour from now for testing
export const MOCK_DEADLINE = new Date(
    Date.now() + 60 * 60 * 1000,
).toISOString();

let sessionSubmissions: Submission[] = [
    {
        id: "sub_1",
        event_id: MOCK_EVENT_ID,
        team_id: "t1", // Neural Forge
        repo_url: "https://github.com/neural-forge/edge-inference",
        demo_url: "https://youtube.com/watch?v=demo",
        description:
            "An on-device ML toolkit optimized for memory-constrained edge nodes.",
        is_draft: false,
        excluded_from_gallery: false,
        updated_at: new Date().toISOString(),
    },
];

export function getMockSubmissionsStore() {
    return {
        submissions: sessionSubmissions,
        setSubmissions: (s: Submission[]) => {
            sessionSubmissions = s;
        },
    };
}
