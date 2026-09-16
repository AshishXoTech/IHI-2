import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

// Usage: <Card padding="md" border radius="md">content</Card>
// A neutral container wrapper — no opinions on internal layout.

type Padding = "none" | "sm" | "md" | "lg";
type Radius = "none" | "sm" | "md";
type Variant = "default" | "elevated" | "interactive" | "dense";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  border?: boolean;
  radius?: Radius;
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: "border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] rounded-[var(--radius-lg)]",
  elevated: "border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] rounded-[var(--radius-lg)] shadow-[0_4px_24px_-4px_rgba(28,25,23,0.08)]",
  interactive: "border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] rounded-[var(--radius-lg)] transition-all duration-[var(--dur-fast)] hover:border-[var(--ihi-surface-300)] hover:shadow-[0_2px_12px_-2px_rgba(28,25,23,0.06)] cursor-pointer",
  dense: "border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] rounded-[var(--radius-md)]",
};

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const radiusClasses: Record<Radius, string> = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = "md",
      border = true,
      radius = "md",
      variant,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          variant ? variantClasses[variant] : "bg-[var(--ihi-surface-0)]",
          !variant && border && "border border-[var(--ihi-surface-200)]",
          !variant && radiusClasses[radius],
          paddingClasses[padding],
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
