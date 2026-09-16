"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

interface CountdownTimerProps {
  deadlineIso: string;
  onExpire?: () => void;
}

export function CountdownTimer({ deadlineIso, onExpire }: CountdownTimerProps) {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);

  // 1. Sync local clock with server time
  useEffect(() => {
    fetch("/api/submissions/time")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          const serverTime = new Date(json.data.server_time).getTime();
          const localTime = Date.now();
          setOffsetMs(serverTime - localTime);
          setSynced(true);
        }
      })
      .catch(() => {
        // Fallback to local time if network fails
        setOffsetMs(0);
        setSynced(true);
      });
  }, []);

  // 2. Tick timer
  useEffect(() => {
    if (!synced) return;

    const deadlineTime = new Date(deadlineIso).getTime();
    
    const tick = () => {
      const currentTrueTime = Date.now() + offsetMs;
      const diff = deadlineTime - currentTrueTime;
      
      if (diff <= 0) {
        setTimeLeftMs(0);
        onExpire?.();
      } else {
        setTimeLeftMs(diff);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [synced, offsetMs, deadlineIso, onExpire]);

  if (!synced || timeLeftMs === null) {
    return <div className="h-6 w-32 animate-pulse bg-[var(--border-default)] rounded" />;
  }

  const isExpired = timeLeftMs <= 0;
  const isUrgent = timeLeftMs > 0 && timeLeftMs < 15 * 60 * 1000; // Under 15 mins

  const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const mins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm font-semibold tabular-nums border",
        isExpired
          ? "bg-[var(--destructive-subtle)] text-[var(--destructive)] border-[var(--destructive)]"
          : isUrgent
          ? "bg-[var(--signal-attention-bg)] text-[var(--signal-attention)] border-[var(--signal-attention)]"
          : "bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-default)]"
      )}
      role="timer"
      aria-live={isUrgent ? "assertive" : "polite"}
    >
      <span className={clsx("h-2 w-2 rounded-full", isExpired ? "bg-[var(--destructive)]" : isUrgent ? "bg-[var(--signal-attention)] animate-pulse" : "bg-[var(--signal-good)]")} />
      {isExpired ? "DEADLINE PASSED" : `${format(hours)}:${format(mins)}:${format(secs)} REMAINING`}
    </div>
  );
}