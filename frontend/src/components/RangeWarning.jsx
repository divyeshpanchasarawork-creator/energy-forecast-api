import { AlertTriangle, RefreshCw } from "lucide-react";
import { formatUkDate } from "../utils/formatters";

export default function RangeWarning({ failures = [], onRetry }) {
  if (failures.length === 0) {
    return null;
  }

  const dates = failures.map((failure) => formatUkDate(failure.date));
  const label = dates.length === 1 ? "day" : "days";

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-2">
        <AlertTriangle
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <p>
          {failures.length} {label} could not be loaded: {dates.join(", ")}.
          Metrics below exclude failed {label}.
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 text-xs font-medium text-amber-900 outline-none transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-600/30"
        >
          <RefreshCw size={13} aria-hidden="true" />
          Retry failed days
        </button>
      ) : null}
    </div>
  );
}
