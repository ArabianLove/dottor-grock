import { cn } from "@/lib/utils";

export function GrockMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-accent", className)}
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 3.2v25.2" />
        <path d="M12.2 4.2h7.6" />
        <path d="M21.8 8.2c-6.4 1.6-9.2 4.2-9.2 7.1 0 2.6 2.2 4.2 7.4 6.2-6.4 1.5-9.4 4-9.4 7" />
      </g>
    </svg>
  );
}
