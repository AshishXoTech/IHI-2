"use client";

import { clsx } from "clsx";

// Usage: <SkillFilter skills={all} selected={selected} onChange={setSelected} />

interface SkillFilterProps {
  skills: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

export function SkillFilter({
  skills,
  selected,
  onChange,
  className,
}: SkillFilterProps) {
  function toggle(skill: string) {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  }

  if (skills.length === 0) return null;

  return (
    <div
      className={clsx("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Filter by skills"
    >
      {skills.map((skill) => {
        const active = selected.includes(skill);
        return (
          <button
            key={skill}
            type="button"
            onClick={() => toggle(skill)}
            aria-pressed={active}
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              "border transition-colors duration-150 motion-reduce:transition-none",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-bg)]",
              active
                ? "bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)]"
                : "bg-[var(--surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
            )}
          >
            {skill}
          </button>
        );
      })}
    </div>
  );
}