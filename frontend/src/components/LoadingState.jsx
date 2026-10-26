import { Loader2 } from "lucide-react";

export default function LoadingState({
  label = "Loading forecast data",
  message = "Fetching forecasts and actual generation from the API.",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center"
    >
      <Loader2
        size={22}
        className="animate-spin text-emerald-700"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-neutral-700">{label}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">
        {message}
      </p>
    </div>
  );
}
