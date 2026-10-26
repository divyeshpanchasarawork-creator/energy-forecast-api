import { formatTime } from "../utils/formatters";

const statusConfig = {
  loading: {
    label: "Loading",
    dotClass: "animate-pulse bg-neutral-400",
  },
  refreshing: {
    label: "Refreshing",
    dotClass: "animate-pulse bg-neutral-400",
  },
  success: {
    label: "Connected",
    dotClass: "bg-emerald-600",
  },
  error: {
    label: "API error",
    dotClass: "bg-red-500",
  },
  idle: {
    label: "Select a valid range",
    dotClass: "bg-amber-500",
  },
};

export default function ApiStatus({ status, lastUpdated }) {
  const config = statusConfig[status] ?? statusConfig.loading;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
      {status === "success" && lastUpdated ? (
        <>
          <span className="text-neutral-300">·</span>
          <span>Fetched {formatTime(lastUpdated)} UTC</span>
        </>
      ) : null}
    </div>
  );
}
