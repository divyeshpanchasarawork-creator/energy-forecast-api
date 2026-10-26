import { useMemo } from "react";
import {
  buildDeliverySeries,
  summarizeDeliverySeries,
} from "../utils/deliverySeries";
import {
  formatDateTimeUtc,
  formatPercent,
  formatUkDate,
  formatUkDateTime,
} from "../utils/formatters";
import { toFiniteNumber } from "../utils/numbers";

function SummaryItem({ label, value }) {
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-400">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium tabular-nums text-neutral-800">
        {value}
      </dd>
    </div>
  );
}

export default function EvaluationSummary({ report, forecasts, period }) {
  const summary = useMemo(
    () =>
      summarizeDeliverySeries(
        buildDeliverySeries({ forecasts, report, period }),
      ),
    [forecasts, report, period],
  );
  const matched = toFiniteNumber(report?.matchedPeriods);
  const expected = toFiniteNumber(report?.expectedPeriods);
  const coverage = toFiniteNumber(report?.coveragePercent);
  const hasMatches = matched !== null && matched > 0;
  const hasForecasts = summary.forecastCount > 0;
  const isComplete = hasMatches && coverage !== null && coverage >= 99.95;

  let statusLabel = "Forecast pending";
  let statusClass = "bg-neutral-100 text-neutral-600";

  if (isComplete) {
    statusLabel = "Complete coverage";
    statusClass = "bg-emerald-50 text-emerald-700";
  } else if (hasMatches) {
    statusLabel = "Partial coverage";
  } else if (hasForecasts && period.isPreview) {
    statusLabel = "Live preview";
  } else if (hasForecasts) {
    statusLabel = "Awaiting actuals";
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Evaluation summary
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Gate closure, forecast availability, matched hours, and actual
            coverage.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-px bg-neutral-200 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryItem
          label="Delivery day"
          value={`${formatUkDate(period.date)} (UK)`}
        />
        <SummaryItem
          label="Gate closure"
          value={
            <span>
              <span>
                {period.preset.shortLabel} ·{" "}
                {formatUkDateTime(period.targetCutoff)}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal text-neutral-500">
                {formatDateTimeUtc(period.targetCutoff)}
              </span>
            </span>
          }
        />
        <SummaryItem
          label="Forecast hours"
          value={
            expected === null
              ? summary.forecastCount
              : `${summary.forecastCount} of ${expected}`
          }
        />
        <SummaryItem
          label="Matched hours"
          value={matched === null ? "No data" : matched}
        />
        <SummaryItem
          label="Coverage"
          value={hasMatches ? formatPercent(coverage) : "No data"}
        />
      </dl>

      <div className="border-t border-neutral-200 px-4 py-3 text-xs leading-5 text-neutral-500 sm:px-5">
        {period.isPreview ? (
          <p className="mb-1.5">
            This is a live preview. The API is using the latest forecasts
            available when the page loaded, not the future gate closure.
          </p>
        ) : null}
        <p>
          Error is actual generation minus forecast generation. Negative mean
          bias indicates overforecasting. Missing hours are excluded from error
          metrics and are never treated as zero generation.
        </p>
      </div>
    </section>
  );
}
