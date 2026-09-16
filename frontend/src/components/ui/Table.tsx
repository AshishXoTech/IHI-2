import { type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes, forwardRef } from "react";

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className = "", ...rest }, ref) => <div className="w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--ihi-surface-200)]"><table ref={ref} className={["w-full text-sm", className].join(" ")} {...rest} /></div>,
);
Table.displayName = "Table";
export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...rest }, ref) => <thead ref={ref} className={["border-b border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-50)]", className].join(" ")} {...rest} />,
);
TableHeader.displayName = "TableHeader";
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...rest }, ref) => <tbody ref={ref} className={className} {...rest} />,
);
TableBody.displayName = "TableBody";
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = "", ...rest }, ref) => <tr ref={ref} className={["border-b border-[var(--ihi-surface-100)] last:border-0 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--ihi-surface-50)]", className].join(" ")} {...rest} />,
);
TableRow.displayName = "TableRow";
export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...rest }, ref) => <th ref={ref} className={["px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--ihi-surface-500)]", className].join(" ")} {...rest} />,
);
TableHead.displayName = "TableHead";
export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...rest }, ref) => <td ref={ref} className={["px-4 py-3 text-[var(--ihi-surface-800)]", className].join(" ")} {...rest} />,
);
TableCell.displayName = "TableCell";
export const TableEmpty = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement> & { colSpan: number; message?: string }>(
  ({ className = "", children, message, ...rest }, ref) => <tr><td ref={ref} className={["px-4 py-12 text-center text-sm text-[var(--ihi-surface-400)]", className].join(" ")} {...rest}>{children ?? message}</td></tr>,
);
TableEmpty.displayName = "TableEmpty";
