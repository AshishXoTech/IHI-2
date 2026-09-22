import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

// Usage: <StatusBadge status="good" label="Approved" />
// Signal Light pattern: colored dot + text label.
// Status colors are defined as CSS tokens in globals.css — do not override inline.

type Status = "good" | "attention" | "critical" | "neutral";
type SignalStatus = Status;

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
  label: string;
  className?: string;
}

const dotClasses: Record<Status, string> = {
  good: "bg-[var(--ihi-signal-go)]",
  attention: "bg-[var(--ihi-signal-warn)]",
  critical: "bg-[var(--ihi-signal-stop)]",
  neutral: "bg-[var(--ihi-signal-neutral,#94a3b8)]",
};

const bgClasses: Record<Status, string> = {
  good: "bg-[var(--ihi-signal-go-bg)]",
  attention: "bg-[var(--ihi-signal-warn-bg)]",
  critical: "bg-[var(--ihi-signal-stop-bg)]",
  neutral: "bg-[var(--ihi-signal-neutral-bg,rgba(148,163,184,0.12))]",
};

const textClasses: Record<Status, string> = {
  good: "text-[var(--ihi-signal-go)]",
  attention: "text-[var(--ihi-signal-warn)]",
  critical: "text-[var(--ihi-signal-stop)]",
  neutral: "text-[var(--ihi-signal-neutral,#64748b)]",
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status = "neutral", label, className, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1.5",
          "rounded-full px-2 py-0.5",
          "text-xs font-medium leading-none",
          bgClasses[status] || bgClasses.neutral,
          textClasses[status] || textClasses.neutral,
          className
        )}
        role="status"
        {...rest}
      >
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            dotClasses[status] || dotClasses.neutral
          )}
          aria-hidden="true"
        />
        {label}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
export type { StatusBadgeProps, Status, SignalStatus };