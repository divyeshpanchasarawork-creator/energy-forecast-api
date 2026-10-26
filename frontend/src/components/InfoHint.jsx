import { useId } from "react";
import { Info } from "lucide-react";

export default function InfoHint({ text }) {
  const id = useId();

  return (
    <span
      tabIndex={0}
      aria-label="More information"
      aria-describedby={id}
      className="group relative inline-flex items-center justify-center rounded-full text-neutral-400 outline-none focus-visible:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600/30"
    >
      <Info size={13} strokeWidth={1.8} aria-hidden="true" />
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-60 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-4 text-neutral-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
