/**
 * Participant shell — Dev B.
 * Keeps participant routes visually consistent without touching Dev A layouts.
 */
export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface-bg)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface)]">
        <div className="mx-auto flex h-12 max-w-6xl items-center px-4">
          <span className="text-sm font-semibold tracking-tight">IHI</span>
          <span className="mx-2 text-[var(--text-muted)]">/</span>
          <span className="text-sm text-[var(--text-secondary)]">Participant</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}