/**
 * Mock data for Team Formation UI.
 * Swap off once Dev A lands the schema + join_team RPC.
 * Toggle via NEXT_PUBLIC_USE_TEAM_MOCKS=true in .env.local
 */
import type {
  Team,
  TeamMember,
  TeamJoinRequest,
  TeamChatMessage,
  SoloParticipant,
} from "@/types/shared";

export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_TEAM_MOCKS === "true" ||
  process.env.NODE_ENV === "development";

export const MOCK_EVENT_ID = "00000000-0000-4000-8000-000000000001";
export const MOCK_USER_ID = "00000000-0000-4000-8000-0000000000aa";
export const MOCK_USER_NAME = "You";

export const mockTeams: Team[] = [
  {
    id: "t1",
    event_id: MOCK_EVENT_ID,
    name: "Neural Forge",
    description: "Building an on-device ML toolkit for edge inference.",
    skills_wanted: ["Python", "PyTorch", "React"],
    track: "AI/ML",
    max_members: 4,
    status: "forming",
    lead_user_id: "u2",
    member_count: 2,
    created_at: "2026-09-10T10:00:00Z",
  },
  {
    id: "t2",
    event_id: MOCK_EVENT_ID,
    name: "Packet Riders",
    description: "Real-time network observability for student infra.",
    skills_wanted: ["Go", "eBPF", "TypeScript"],
    track: "Systems",
    max_members: 3,
    status: "full",
    lead_user_id: "u3",
    member_count: 3,
    created_at: "2026-09-10T11:00:00Z",
  },
  {
    id: "t3",
    event_id: MOCK_EVENT_ID,
    name: "Ledger Light",
    description: "Transparent judging audit trail as a public good.",
    skills_wanted: ["Solidity", "Next.js", "Postgres"],
    track: "Web3",
    max_members: 4,
    status: "forming",
    lead_user_id: "u4",
    member_count: 1,
    created_at: "2026-09-11T09:00:00Z",
  },
  {
    id: "t4",
    event_id: MOCK_EVENT_ID,
    name: "A11y First",
    description: "Accessibility linting that blocks bad PRs before merge.",
    skills_wanted: ["TypeScript", "AST", "Design Systems"],
    track: "DevTools",
    max_members: 4,
    status: "forming",
    lead_user_id: "u5",
    member_count: 3,
    created_at: "2026-09-11T14:00:00Z",
  },
];

export const mockMembers: Record<string, TeamMember[]> = {
  t1: [
    {
      id: "m1",
      team_id: "t1",
      user_id: "u2",
      role: "lead",
      display_name: "Priya N.",
      skills: ["Python", "PyTorch"],
      joined_at: "2026-09-10T10:00:00Z",
    },
    {
      id: "m2",
      team_id: "t1",
      user_id: "u6",
      role: "member",
      display_name: "Jordan K.",
      skills: ["React", "CSS"],
      joined_at: "2026-09-10T12:00:00Z",
    },
  ],
  t2: [
    {
      id: "m3",
      team_id: "t2",
      user_id: "u3",
      role: "lead",
      display_name: "Sam R.",
      skills: ["Go", "eBPF"],
      joined_at: "2026-09-10T11:00:00Z",
    },
    {
      id: "m4",
      team_id: "t2",
      user_id: "u7",
      role: "member",
      display_name: "Alex M.",
      skills: ["TypeScript"],
      joined_at: "2026-09-10T12:30:00Z",
    },
    {
      id: "m5",
      team_id: "t2",
      user_id: "u8",
      role: "member",
      display_name: "Chris P.",
      skills: ["Go"],
      joined_at: "2026-09-10T13:00:00Z",
    },
  ],
  t3: [
    {
      id: "m6",
      team_id: "t3",
      user_id: "u4",
      role: "lead",
      display_name: "Nina V.",
      skills: ["Solidity", "Postgres"],
      joined_at: "2026-09-11T09:00:00Z",
    },
  ],
  t4: [
    {
      id: "m7",
      team_id: "t4",
      user_id: "u5",
      role: "lead",
      display_name: "Omar H.",
      skills: ["TypeScript", "AST"],
      joined_at: "2026-09-11T14:00:00Z",
    },
    {
      id: "m8",
      team_id: "t4",
      user_id: "u9",
      role: "member",
      display_name: "Lee T.",
      skills: ["Design Systems"],
      joined_at: "2026-09-11T15:00:00Z",
    },
    {
      id: "m9",
      team_id: "t4",
      user_id: "u10",
      role: "member",
      display_name: "Casey B.",
      skills: ["TypeScript"],
      joined_at: "2026-09-11T16:00:00Z",
    },
  ],
};

export const mockRequests: TeamJoinRequest[] = [];

export const mockMessages: Record<string, TeamChatMessage[]> = {
  t1: [
    {
      id: "msg1",
      team_id: "t1",
      user_id: "u2",
      display_name: "Priya N.",
      body: "Hey — pushing the model export script in 10.",
      created_at: "2026-09-12T10:00:00Z",
      reported: false,
    },
    {
      id: "msg2",
      team_id: "t1",
      user_id: "u6",
      display_name: "Jordan K.",
      body: "UI shell is up on the staging branch.",
      created_at: "2026-09-12T10:05:00Z",
      reported: false,
    },
  ],
};

export const mockSoloPool: SoloParticipant[] = [
  {
    user_id: "u20",
    event_id: MOCK_EVENT_ID,
    registration_id: "r20",
    display_name: "Riley Q.",
    skills: ["Figma", "React", "Accessibility"],
    bio: "Designer-developer hybrid. Looking for a product-minded team.",
    looking_since: "2026-09-11T08:00:00Z",
  },
  {
    user_id: "u21",
    event_id: MOCK_EVENT_ID,
    registration_id: "r21",
    display_name: "Morgan S.",
    skills: ["Rust", "Wasm", "Postgres"],
    bio: "Systems person. Happy to own the hard performance bits.",
    looking_since: "2026-09-11T09:30:00Z",
  },
  {
    user_id: "u22",
    event_id: MOCK_EVENT_ID,
    registration_id: "r22",
    display_name: "Avery L.",
    skills: ["Python", "NLP", "FastAPI"],
    bio: null,
    looking_since: "2026-09-12T07:00:00Z",
  },
];

/** In-memory mutable store for mock join/create during a session */
let sessionTeams = [...mockTeams];
let sessionMembers = { ...mockMembers };
let sessionSolo = [...mockSoloPool];
let sessionMessages = { ...mockMessages };
let sessionRequests = [...mockRequests];

export function getMockStore() {
  return {
    teams: sessionTeams,
    members: sessionMembers,
    solo: sessionSolo,
    messages: sessionMessages,
    requests: sessionRequests,
    setTeams: (t: Team[]) => {
      sessionTeams = t;
    },
    setMembers: (m: Record<string, TeamMember[]>) => {
      sessionMembers = m;
    },
    setSolo: (s: SoloParticipant[]) => {
      sessionSolo = s;
    },
    setMessages: (m: Record<string, TeamChatMessage[]>) => {
      sessionMessages = m;
    },
    setRequests: (r: TeamJoinRequest[]) => {
      sessionRequests = r;
    },
  };
}