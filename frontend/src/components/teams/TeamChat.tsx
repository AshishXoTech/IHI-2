"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { TeamChatMessage } from "@/types/shared";
import { clsx } from "clsx";

// Usage: <TeamChat teamId={id} currentUserId={uid} initialMessages={[]} />
// Subscribes to Realtime channel `team-chat:{teamId}` — one channel per team.

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
  initialMessages?: TeamChatMessage[];
  className?: string;
}

export function TeamChat({
  teamId,
  currentUserId,
  initialMessages = [],
  className,
}: TeamChatProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to latest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription — per-team channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`team-chat:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const row = payload.new as TeamChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const row = payload.new as TeamChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, ...row } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > 2000) {
      setError("Message must be 2000 characters or fewer.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Could not send message.");
        return;
      }
      // Optimistic: Realtime will also deliver; de-dupe by id
      setMessages((prev) => {
        if (prev.some((m) => m.id === json.data.id)) return prev;
        return [...prev, json.data];
      });
      setBody("");
    } catch {
      setError("Network error — try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleReport(messageId: string) {
    try {
      await fetch(`/api/teams/${teamId}/messages/${messageId}/report`, {
        method: "POST",
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reported: true } : m))
      );
    } catch {
      // silent — reporting is best-effort
    }
  }

  return (
    <div
      className={clsx(
        "flex flex-col border border-[var(--border-default)] rounded-lg bg-[var(--surface)] overflow-hidden",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-[var(--border-default)] bg-[var(--surface-bg)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Team chat
        </h3>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[200px] max-h-[360px]"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            No messages yet. Say hello to your team.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === currentUserId;
          return (
            <div
              key={m.id}
              className={clsx(
                "flex flex-col max-w-[85%]",
                mine ? "self-end items-end" : "self-start items-start"
              )}
            >
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {mine ? "You" : m.display_name}
                </span>
                <time className="text-[10px] text-[var(--text-muted)]">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <div
                className={clsx(
                  "rounded-md px-2.5 py-1.5 text-sm",
                  mine
                    ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                    : "bg-[var(--surface-bg)] text-[var(--text-primary)] border border-[var(--border-default)]"
                )}
              >
                {m.reported ? (
                  <span className="italic text-[var(--text-muted)]">
                    Message reported
                  </span>
                ) : (
                  m.body
                )}
              </div>
              {!mine && !m.reported && (
                <button
                  type="button"
                  onClick={() => handleReport(m.id)}
                  className="mt-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--destructive)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded-sm"
                >
                  Report
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 p-2 border-t border-[var(--border-default)]"
      >
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message your team…"
          maxLength={2000}
          aria-label="Chat message"
          className="flex-1 rounded-md px-3 py-2 text-sm bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-default)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
        <Button type="submit" size="md" loading={sending} disabled={!body.trim()}>
          Send
        </Button>
      </form>

      {error && (
        <p className="px-3 pb-2 text-xs text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}