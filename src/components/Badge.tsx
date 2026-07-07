import { clsx } from "clsx";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "gold" | "red" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center border px-2 py-1 text-xs font-medium",
        tone === "neutral" && "border-line bg-white text-muted",
        tone === "blue" && "border-blue/30 bg-white text-blue",
        tone === "gold" && "border-gold bg-white text-ink",
        tone === "red" && "border-oxblood/40 bg-white text-oxblood"
      )}
    >
      {children}
    </span>
  );
}
