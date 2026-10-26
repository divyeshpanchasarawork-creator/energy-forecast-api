import { RefreshCw } from "lucide-react";
import ApiStatus from "./ApiStatus";
import RangeControls from "./RangeControls";
import {
  formatUkDate,
  formatUkDateRange,
  formatUkDateTime,
} from "../utils/formatters";
import {
  DECISION_PRESETS,
  getPeriodKind,
  getRangeKind,
} from "../utils/periods";

const pageCopy = {
  overview: {
    title: "Wind Overview",
    subtitle:
      "Compare the latest available wind forecast with actual generation for a UK delivery day or date range.",
  },
  accuracy: {
    title: "Forecast Accuracy",
    subtitle:
      "Evaluate forecast error and delivery coverage across one day or a custom past-date range.",
  },
};

const snapshotStyles = {
  final: "bg-emerald-50 text-emerald-700",
  preview: "bg-neutral-100 text-neutral-600",
  mixed: "bg-amber-50 text-amber-800",
};

const snapshotLabels = {
  final: "Final snapshot",
  preview: "Live preview",
  mixed: "Mixed final + preview",
};

export default function DashboardHeader({
  view,
  period,
  mode,
  deliveryDate,
  rangeStart,
  rangeEnd,
  rangeError,
  decisionPreset,
  maxDate,
  onModeChange,
  onDateChange,
  onRangeStartChange,
  onRangeEndChange,
  onUseLastSevenDays,
  onPresetChange,
  onRefresh,
  status,
  lastUpdated,
}) {
  const copy = pageCopy[view] ?? pageCopy.overview;
  const isBusy = status === "loading" || status === "refreshing";
  const periodKind = period
    ? mode === "range"
      ? getRangeKind(period.startDate, period.endDate)
      : getPeriodKind(period.date)
    : null;
  const snapshot = period?.snapshot ?? "final";
  const deliveryLabel =
    mode === "range" && period
      ? formatUkDateRange(period.startDate, period.endDate)
      : period
        ? formatUkDate(period.date)
        : null;

  return (
    <header className="mb-6 border-b border-neutral-200 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            {copy.subtitle}
          </p>
        </div>
        <div className="shrink-0 sm:pt-1.5">
          <ApiStatus status={status} lastUpdated={lastUpdated} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <RangeControls
          mode={mode}
          deliveryDate={deliveryDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          maxDate={maxDate}
          rangeError={rangeError}
          onModeChange={onModeChange}
          onDateChange={onDateChange}
          onRangeStartChange={onRangeStartChange}
          onRangeEndChange={onRangeEndChange}
          onUseLastSevenDays={onUseLastSevenDays}
        />

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

        <button
          type="button"
          onClick={onRefresh}
          disabled={isBusy || Boolean(rangeError)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            aria-hidden="true"
            className={isBusy ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {period ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            <span className="text-neutral-500">
              {mode === "range" ? "Delivery range" : "Delivery day"}
            </span>
            <span className="font-medium text-neutral-800">
              {deliveryLabel} (UK)
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {periodKind}
            </span>
            {mode === "range" ? (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                {period.dayCount} {period.dayCount === 1 ? "day" : "days"} ·{" "}
                {period.deliveryHours} hours
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                snapshotStyles[snapshot] ?? snapshotStyles.preview
              }`}
            >
              {snapshotLabels[snapshot] ?? snapshotLabels.preview}
            </span>
            <span className="text-neutral-500">
              {mode === "range"
                ? `${period.preset.auction} · ${period.preset.timeLabel} UK cut-off each day`
                : `${period.preset.auction} · ${
                    period.isPreview ? "closes" : "closed"
                  } ${formatUkDateTime(period.targetCutoff)}`}
            </span>
          </div>

          {period.hasMixedSnapshot ? (
            <p className="text-xs leading-5 text-neutral-500">
              Completed days use their final gate snapshot. The pending day uses
              the latest forecast available when the page loaded.
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
