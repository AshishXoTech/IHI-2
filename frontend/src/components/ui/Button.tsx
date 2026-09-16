"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

// Usage: <Button variant="primary" size="md" loading={false}>Save</Button>
// Variants: primary | secondary | ghost | destructive
// Sizes: sm | md | lg

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    "bg-[var(--ihi-brand-600)] text-white",
    "hover:bg-[var(--ihi-brand-700)] active:bg-[var(--ihi-brand-800)]",
    "focus-visible:ring-[var(--ihi-brand-500)]",
  ].join(" "),
  secondary: [
    "bg-[var(--ihi-surface-0)] text-[var(--ihi-surface-800)] border border-[var(--ihi-surface-200)]",
    "hover:bg-[var(--ihi-surface-50)] hover:border-[var(--ihi-surface-300)]",
    "focus-visible:ring-[var(--ihi-brand-500)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--ihi-surface-600)] hover:bg-[var(--ihi-surface-100)] hover:text-[var(--ihi-surface-900)]",
    "focus-visible:ring-[var(--ihi-brand-500)]",
  ].join(" "),
  destructive: [
    "bg-[var(--ihi-signal-stop)] text-white hover:bg-red-600",
    "focus-visible:ring-[var(--ihi-signal-stop)]",
  ].join(" "),
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs gap-1.5",
  md: "px-3.5 py-1.5 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

const spinnerSizes: Record<Size, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          // Base
          "inline-flex items-center justify-center",
          "rounded-[var(--radius-md)] font-medium",
          "transition-colors duration-150",
          "motion-reduce:transition-none",
          // Focus ring — visible on keyboard nav only
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ihi-surface-0)]",
          // Disabled
          isDisabled && "opacity-50 pointer-events-none cursor-not-allowed",
          // Variant + Size
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {loading && (
          <svg
            className={clsx(
              "animate-[ihi-spin_0.8s_linear_infinite]",
              "motion-reduce:animate-none",
              spinnerSizes[size]
            )}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="12"
              opacity="0.7"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize };
