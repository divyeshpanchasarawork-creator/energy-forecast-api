import {
  formatMetric,
  formatPercent,
  formatUkDate,
  NO_DATA,
} from "../utils/formatters";
import { toFiniteNumber } from "../utils/numbers";

const snapshotStyles = {
  final: "bg-emerald-50 text-emerald-700",
  preview: "bg-neutral-100 text-neutral-600",
};

const snapshotLabels = {
  final: "Final",
  preview: "Preview",
};

export default function DailyBreakdown({ daily = [] }) {
  if (daily.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Daily breakdown
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Accuracy for each loaded delivery day. Metrics exclude days that
          failed to load.
        </p>
      </div>

      <div
        role="region"
        aria-label="Daily accuracy breakdown"
        tabIndex={0}
        className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/30"
      >
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Daily forecast accuracy for the selected delivery range
          </caption>
          <thead className="bg-stone-50">
            <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
              <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                Delivery day (UK)
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Snapshot
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium"
              >
                Coverage
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium"
              >
                Matched
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium"
              >
                MAE
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium"
              >
                RMSE
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium sm:px-5"
              >
                MBE
              </th>
            </tr>
          </thead>
          <tbody>
            {daily.map((entry) => {
              const matched = toFiniteNumber(entry.report?.matchedPeriods);
              const expected = toFiniteNumber(entry.report?.expectedPeriods);
              const hasMatches = matched !== null && matched > 0;
              const snapshot = entry.period?.snapshot ?? "final";

              return (
                <tr
                  key={entry.date}
                  className="border-b border-neutral-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-700 sm:px-5">
                    {formatUkDate(entry.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        snapshotStyles[snapshot] ?? snapshotStyles.preview
                      }`}
                    >
                      {snapshotLabels[snapshot] ?? snapshotLabels.preview}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                    {hasMatches
                      ? formatPercent(entry.report?.coveragePercent)
                      : NO_DATA}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                    {matched === null
                      ? NO_DATA
                      : `${matched} of ${expected ?? matched}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                    {hasMatches ? formatMetric(entry.report?.mae) : NO_DATA}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                    {hasMatches ? formatMetric(entry.report?.rmse) : NO_DATA}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700 sm:px-5">
                    {hasMatches
                      ? formatMetric(entry.report?.meanBiasError)
                      : NO_DATA}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
