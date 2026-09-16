'use client';

import { useFlashOnChange } from './useFlashOnChange';
import { Card } from '@/components/ui';

interface MetricCardProps {
  label: string;
  value: number | string;
  /** Optional secondary line beneath the big number */
  subtitle?: string;
  /** Slot for a StatusBadge or icon in the top-right */
  indicator?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Single KPI tile with a flash-on-change background pulse.
 *
 * The flash uses an inline `backgroundColor` transition so we don't
 * need to touch globals.css.  Tower-mode tokens are referenced via
 * CSS custom properties with safe fallbacks.
 */
export function MetricCard({
  label,
  value,
  subtitle,
  indicator,
  children,
}: MetricCardProps) {
  const flashing = useFlashOnChange(value);

  return (
    <Card className="relative overflow-hidden p-5">
      {/* flash layer — sits behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-colors duration-200 ease-out"
        style={{
          backgroundColor: flashing
            ? 'var(--ihi-signal-go-bg)'
            : 'transparent',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--ihi-surface-500)]">
            {label}
          </p>
          {indicator && <span className="shrink-0">{indicator}</span>}
        </div>

        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--ihi-surface-900)]" style={{ fontFamily: "var(--font-mono)" }}>
          {value}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs text-[var(--ihi-surface-400)]">
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </Card>
  );
}
