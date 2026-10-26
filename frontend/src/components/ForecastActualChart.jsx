import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "./EmptyState";
import {
  buildDeliverySeries,
  summarizeDeliverySeries,
} from "../utils/deliverySeries";
import {
  formatChartTime,
  formatDateTimeUtc,
  formatNumber,
  formatPercent,
  formatSignedNumber,
  formatUkDateRange,
  NO_DATA,
} from "../utils/formatters";

function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px] font-medium text-neutral-500">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-emerald-700" />
        Forecast
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-neutral-900" />
        Actual
      </span>
    </div>
  );
}

function formatMw(value) {
  return value === null ? NO_DATA : `${formatNumber(value)} MW`;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="min-w-[210px] rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-medium text-neutral-900">
        {formatDateTimeUtc(point.timestamp)}
      </p>
      <dl className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">Forecast</dt>
          <dd className="tabular-nums text-neutral-800">
            {formatMw(point.forecast)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">Actual</dt>
          <dd className="tabular-nums text-neutral-800">
            {point.actual === null && point.hasForecast
              ? "Awaiting actual"
              : formatMw(point.actual)}
          </dd>
        </div>
      </dl>
      {point.forecastPublishTime ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          Forecast published {formatDateTimeUtc(point.forecastPublishTime)}
        </p>
      ) : null}
      <p className="mt-2 border-t border-neutral-100 pt-2 text-[11px] text-neutral-500">
        {point.status === "matched"
          ? `Error ${formatSignedNumber(point.error)} MW`
          : point.status === "awaiting-actual"
            ? "Awaiting actual generation"
            : "No forecast or actual data for this hour"}
      </p>
    </div>
  );
}

export default function ForecastActualChart({ report, forecasts, period }) {
  const series = useMemo(
    () => buildDeliverySeries({ forecasts, report, period }),
    [forecasts, report, period],
  );
  const summary = useMemo(() => summarizeDeliverySeries(series), [series]);
  const isRange = period.dayCount > 1;
  const periodLabel = isRange
    ? `${formatUkDateRange(period.startDate, period.endDate)} · ${period.dayCount} delivery days`
    : `${formatUkDateRange(period.startDate, period.endDate)} UK delivery day`;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Forecast vs actual generation
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Hourly wind generation in MW · {periodLabel} · hours in UTC
          </p>
        </div>
        <ChartLegend />
      </div>

      <div className="p-4 sm:p-5">
        {summary.forecastCount === 0 && summary.actualCount === 0 ? (
          <EmptyState
            title="No forecast or actual data"
            message="The API returned no selected forecast or actual wind generation for the delivery hours in this snapshot. Choose another date or range, preset, or refresh the data."
          />
        ) : (
          <>
            <div
              role="img"
              aria-label={`Forecast versus actual wind generation for ${periodLabel}. ${summary.forecastCount} forecast hours and ${summary.matchedCount} matched hours.`}
              className="h-[300px] w-full sm:h-[380px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#e7e5e4"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) =>
                      formatChartTime(value, isRange)
                    }
                    tickCount={isRange ? 9 : 6}
                    minTickGap={28}
                    tickLine={false}
                    axisLine={{ stroke: "#e7e5e4" }}
                    tick={{ fill: "#78716c", fontSize: 11 }}
                  />
                  <YAxis
                    width={52}
                    domain={["auto", "auto"]}
                    tickFormatter={formatNumber}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fill: "#78716c", fontSize: 11 }}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "#d6d3d1", strokeWidth: 1 }}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Line
                    type="linear"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#15803d"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="actual"
                    name="Actual"
                    stroke="#1c1917"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <p>
                {summary.forecastCount} forecast hours ·{" "}
                {summary.matchedCount} matched
              </p>
              <p>
                {summary.matchedCount > 0
                  ? `${formatPercent(report?.coveragePercent)} actual coverage`
                  : `${summary.awaitingActualCount} hours awaiting actuals`}
              </p>
            </div>

            {summary.awaitingActualCount > 0 ? (
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Forecasts are available for upcoming hours; actual generation
                will appear after it is published.
              </p>
            ) : null}

            {summary.missingCount > 0 ? (
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Missing delivery hours are shown as line breaks, not zero
                generation.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
