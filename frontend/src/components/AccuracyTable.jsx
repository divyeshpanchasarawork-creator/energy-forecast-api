import { useMemo } from "react";
import EmptyState from "./EmptyState";
import {
  buildDeliverySeries,
  summarizeDeliverySeries,
} from "../utils/deliverySeries";
import {
  formatDateTime,
  formatNumber,
  formatSignedNumber,
  formatUkDate,
} from "../utils/formatters";

const statusStyles = {
  matched: "bg-emerald-50 text-emerald-700",
  "awaiting-actual": "bg-neutral-100 text-neutral-600",
  "actual-only": "bg-red-50 text-red-700",
  missing: "bg-neutral-100 text-neutral-500",
};

const statusLabels = {
  matched: "Matched",
  "awaiting-actual": "Awaiting actual",
  "actual-only": "No forecast",
  missing: "Missing",
};

export default function AccuracyTable({ report, forecasts, period }) {
  const series = useMemo(
    () => buildDeliverySeries({ forecasts, report, period }),
    [forecasts, report, period],
  );
  const summary = useMemo(() => summarizeDeliverySeries(series), [series]);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Delivery hour detail
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Expected hourly periods with forecast publication and performance ·
            UTC
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          {summary.forecastCount} forecast hours · {summary.matchedCount}{" "}
          matched
        </p>
      </div>

      {summary.forecastCount === 0 && summary.actualCount === 0 ? (
        <EmptyState
          title="No forecast or actual observations"
          message="No delivery hours could be matched to a selected forecast or actual generation. Try another delivery date, preset, or refresh the data."
        />
      ) : (
        <>
          <div
            role="region"
            aria-label="Delivery hour forecast accuracy table"
            tabIndex={0}
            className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/30"
          >
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Forecast and matched delivery hours for{" "}
                  {formatUkDate(period.date)} UK delivery day
                </caption>
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Delivery hour (UTC)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Forecast (MW)
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Published (UTC)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Actual (MW)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Error (MW)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Abs. error (MW)
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((point) => {
                    const hasNegativeError =
                      point.error !== null && point.error < 0;

                    return (
                      <tr
                        key={point.timestamp}
                        className={`border-b border-neutral-100 last:border-0 ${
                          point.status === "missing"
                            ? "bg-stone-50/60"
                            : "hover:bg-stone-50"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-700 sm:px-5">
                          {formatDateTime(point.timestamp)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                          {formatNumber(point.forecast)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-500">
                          {point.forecastPublishTime
                            ? formatDateTime(point.forecastPublishTime)
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                          {point.actual === null && point.hasForecast
                            ? "Pending"
                            : formatNumber(point.actual)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${
                            hasNegativeError
                              ? "font-medium text-red-600"
                              : "text-neutral-700"
                          }`}
                        >
                          {formatSignedNumber(point.error)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                          {formatNumber(point.absoluteError)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              statusStyles[point.status] ?? statusStyles.missing
                            }`}
                          >
                            {statusLabels[point.status] ??
                              statusLabels.missing}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {summary.awaitingActualCount > 0 ? (
            <p className="border-t border-neutral-200 px-4 py-3 text-xs leading-5 text-neutral-500 sm:px-5">
              {summary.awaitingActualCount} forecast hours are awaiting actual
              generation. They are excluded from error metrics until the
              backend can match them.
            </p>
          ) : null}

          {summary.missingCount > 0 ? (
            <p className="border-t border-neutral-200 px-4 py-3 text-xs leading-5 text-neutral-500 sm:px-5">
              Missing hours are shown for context. They are excluded from error
              metrics and are never treated as zero generation.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
