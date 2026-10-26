import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  buildDeliverySeries,
  summarizeDeliverySeries,
} from "../utils/deliverySeries";
import {
  formatDateTimeUtc,
  formatPercent,
  formatUkDateRange,
  formatUkDateTimeWithUtc,
} from "../utils/formatters";
import { toFiniteNumber } from "../utils/numbers";

function DetailItem({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-neutral-700">{value}</dd>
    </div>
  );
}

export default function DataDetails({ period, report, forecasts = [] }) {
  const summary = useMemo(
    () =>
      summarizeDeliverySeries(
        buildDeliverySeries({ forecasts, report, period }),
      ),
    [forecasts, report, period],
  );
  const matched = toFiniteNumber(report?.matchedPeriods);
  const hasMatches = matched !== null && matched > 0;
  const isRange = period.dayCount > 1;
  const snapshotLabel =
    period.snapshot === "final"
      ? "Final snapshot"
      : period.snapshot === "preview"
        ? "Live preview"
        : "Mixed final + preview";

  return (
    <details className="group rounded-xl border border-neutral-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-medium text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span>Data details</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-neutral-400 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-neutral-200 px-4 py-4 sm:px-5">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label={isRange ? "Delivery range" : "Delivery day"}
            value={`${formatUkDateRange(
              period.startDate,
              period.endDate,
            )} (UK) · ${period.dayCount} ${
              period.dayCount === 1 ? "day" : "days"
            } · ${period.deliveryHours} hours`}
          />
          <DetailItem
            label="Delivery window (UTC)"
            value={`${formatDateTimeUtc(
              period.deliveryFrom,
            )} – ${formatDateTimeUtc(period.deliveryTo)}`}
          />
          <DetailItem
            label="Gate closure"
            value={
              isRange
                ? `${period.preset.shortLabel} · ${period.preset.timeLabel} UK each delivery day`
                : `${period.preset.shortLabel} · ${formatUkDateTimeWithUtc(
                    period.targetCutoff,
                  )}`
            }
          />
          <DetailItem
            label="Snapshot used"
            value={
              isRange
                ? snapshotLabel
                : `${snapshotLabel} · ${formatUkDateTimeWithUtc(
                    period.decisionTime,
                  )}`
            }
          />
          <DetailItem
            label="Forecast publish from"
            value={formatDateTimeUtc(period.publishFrom)}
          />
          <DetailItem
            label="Latest forecast publication"
            value={
              summary.latestForecastPublishTime
                ? formatDateTimeUtc(summary.latestForecastPublishTime)
                : summary.forecastCount > 0
                  ? "Not provided"
                  : "No forecasts"
            }
          />
          <DetailItem
            label="Expected hourly periods"
            value={report?.expectedPeriods ?? "No data"}
          />
          <DetailItem
            label="Forecast hourly periods"
            value={summary.forecastCount}
          />
          <DetailItem
            label="Matched hourly periods"
            value={report?.matchedPeriods ?? "No data"}
          />
          <DetailItem
            label="Data coverage"
            value={
              hasMatches ? formatPercent(report?.coveragePercent) : "No data"
            }
          />
        </dl>

        <div className="mt-5 space-y-1.5 border-t border-neutral-100 pt-4 text-xs leading-5 text-neutral-500">
          <p>
            Forecasts are the latest WINDFOR records published on or before each
            delivery day's effective decision time. Nothing published after a
            day's snapshot is used for that day.
          </p>
          <p>
            Before gate closure the effective snapshot is when the page loaded.
            After gate closure it is the selected auction cutoff. Every delivery
            day in a range has its own cutoff. Delivery-day boundaries and
            cutoffs use Europe/London, including BST/GMT changes.
          </p>
          <p>
            Actual generation is FUELHH WIND data, averaged from two half-hour
            settlement periods into hourly values by the backend. Delivery-hour
            timestamps are shown in UTC.
          </p>
          <p>
            Generation values are shown in MW as returned by BMRS. Missing
            periods are not treated as zero.
          </p>
        </div>
      </div>
    </details>
  );
}
