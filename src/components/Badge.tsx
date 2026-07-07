import { clsx } from "clsx";

type Tone = "neutral" | "blue" | "gold" | "red" | "green" | "amber" | "manual";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold leading-5",
        tone === "neutral" && "border-line bg-surface text-muted",
        tone === "blue" && "border-blue/25 bg-surface text-blue",
        tone === "gold" && "border-gold/70 bg-[#fbf7ef] text-ink",
        tone === "red" && "border-oxblood/35 bg-[#fff6f4] text-oxblood",
        tone === "green" && "border-[#59715c]/35 bg-[#f4f8f3] text-[#3d5d41]",
        tone === "amber" && "border-gold2/50 bg-[#fbf4e9] text-[#705733]",
        tone === "manual" && "border-gold bg-surface text-ink"
      )}
    >
      {children}
    </span>
  );
}
