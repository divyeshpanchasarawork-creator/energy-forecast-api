import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({ error, onRetry }) {
  return (
    <div
      role="alert"
      className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-12 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={18} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-neutral-800">
        Could not load forecast data
      </h2>
      <p className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
        {error?.message ||
          "The energy API request failed. Check the backend connection and try again."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-emerald-600/30"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
