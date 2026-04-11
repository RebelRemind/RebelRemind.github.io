export default function StatusPill({ active, inactiveClassName = "border-black/10 bg-black/5 text-black/60", children }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        active
          ? "border-white/30 bg-white/15 text-white"
          : inactiveClassName,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
