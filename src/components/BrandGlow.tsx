// Decorative background glow built from the active theme's primary color.
// Purely cosmetic (aria-hidden); used behind login / wizard / hero surfaces.
export function BrandGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'var(--color-primary)', opacity: 0.16 }}
      />
      <div
        className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'var(--color-primary)', opacity: 0.1 }}
      />
    </div>
  );
}
