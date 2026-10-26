import { CalendarDays, RefreshCw } from "lucide-react";
import ApiStatus from "./ApiStatus";
import { formatUkDate, formatUkDateTime } from "../utils/formatters";
import { DECISION_PRESETS, getPeriodKind } from "../utils/periods";

const pageCopy = {
  overview: {
    title: "Wind Overview",
    subtitle:
      "Compare the latest available wind forecast with actual generation for a UK delivery day.",
  },
  accuracy: {
    title: "Forecast Accuracy",
    subtitle:
      "Evaluate forecast error and delivery coverage at the selected day-ahead gate closure.",
  },
};

export default function DashboardHeader({
  view,
  period,
  deliveryDate,
  decisionPreset,
  maxDate,
  onDateChange,
  onPresetChange,
  onRefresh,
  status,
  lastUpdated,
}) {
  const copy = pageCopy[view] ?? pageCopy.overview;
  const periodKind = getPeriodKind(period.date);
  const isBusy = status === "loading" || status === "refreshing";

  return (
    <header className="mb-6 border-b border-neutral-200 pb-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            {copy.subtitle}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            <span className="text-neutral-500">Delivery day</span>
            <span className="font-medium text-neutral-800">
              {formatUkDate(period.date)} (UK)
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {periodKind}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                period.isPreview
                  ? "bg-neutral-100 text-neutral-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {period.isPreview ? "Live preview" : "Final snapshot"}
            </span>
            <span className="text-neutral-500">
              {period.preset.auction} ·{" "}
              {period.isPreview ? "closes" : "closed"}{" "}
              {formatUkDateTime(period.targetCutoff)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor="decision-preset"
              className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500"
            >
              Auction cutoff
            </label>
            <select
              id="decision-preset"
              value={decisionPreset}
              onChange={(event) => onPresetChange(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 shadow-sm outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 sm:w-44"
            >
              {Object.values(DECISION_PRESETS).map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="delivery-date"
              className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500"
            >
              Delivery date (UK)
            </label>
            <div className="relative mt-1.5">
              <CalendarDays
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                max={maxDate}
                onChange={(event) => {
                  if (event.target.value) {
                    onDateChange(event.target.value);
                  }
                }}
                className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition-colors [color-scheme:light] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 sm:w-40"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isBusy}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={isBusy ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <div className="sm:pb-1">
            <ApiStatus status={status} lastUpdated={lastUpdated} />
          </div>
        </div>
      </div>
    </header>
  );
}
