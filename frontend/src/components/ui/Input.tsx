import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  hint?: string;
  error?: string;
  inputSize?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, hint, error, inputSize = "md", className = "", id: externalId, "aria-describedby": ariaDescribedBy, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const supportingText = helperText ?? hint;
    const describedBy = [ariaDescribedBy, supportingText ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
    const sizeClass = inputSize === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm";
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={id} className="text-xs font-medium text-[var(--ihi-surface-600)]">{label}</label>}
        <input ref={ref} id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy}
          className={[
            "w-full rounded-[var(--radius-md)] border bg-[var(--ihi-surface-0)]",
            "text-[var(--ihi-surface-900)] placeholder:text-[var(--ihi-surface-400)]",
            "transition-colors duration-[var(--dur-fast)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ihi-brand-500)] focus-visible:border-[var(--ihi-brand-500)]",
            "disabled:opacity-40 disabled:pointer-events-none",
            error ? "border-[var(--ihi-signal-stop)]" : "border-[var(--ihi-surface-200)] hover:border-[var(--ihi-surface-300)]",
            sizeClass, className,
          ].join(" ")}
          {...rest}
        />
        {error && <p id={errorId} className="text-xs text-[var(--ihi-signal-stop)]" role="alert">{error}</p>}
        {!error && supportingText && <p id={helperId} className="text-xs text-[var(--ihi-surface-500)]">{supportingText}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
