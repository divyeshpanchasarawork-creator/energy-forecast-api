import MetricCard from "./MetricCard";
import { formatMetric, formatPercent, NO_DATA } from "../utils/formatters";
import { toFiniteNumber } from "../utils/numbers";

export default function MetricSummary({ report, forecasts = [] }) {
  const matched = toFiniteNumber(report?.matchedPeriods);
  const expected = toFiniteNumber(report?.expectedPeriods);
  const hasMatches = matched !== null && matched > 0;
  const hasForecasts = Array.isArray(forecasts) && forecasts.length > 0;

  const metrics = [
    {
      label: "MAE",
      value: hasMatches ? formatMetric(report.mae) : NO_DATA,
      unit: "MW",
      detail: "Mean absolute error",
      hint: "Mean absolute error: the average absolute difference between actual and forecast generation across matched hours.",
      isNoData: !hasMatches || toFiniteNumber(report?.mae) === null,
    },
    {
      label: "RMSE",
      value: hasMatches ? formatMetric(report.rmse) : NO_DATA,
      unit: "MW",
      detail: "Larger errors weigh more",
      hint: "Root mean squared error: the square root of the average squared error. Larger forecast misses have a greater effect.",
      isNoData: !hasMatches || toFiniteNumber(report?.rmse) === null,
    },
    {
      label: "MBE",
      value: hasMatches ? formatMetric(report.meanBiasError) : NO_DATA,
      unit: "MW",
      detail: "Negative means overforecast",
      hint: "Mean bias error: the average of actual minus forecast. Negative values indicate overforecasting; positive values indicate underforecasting.",
      isNoData: !hasMatches || toFiniteNumber(report?.meanBiasError) === null,
    },
    {
      label: "Coverage",
      value: hasMatches ? formatPercent(report.coveragePercent) : NO_DATA,
      unit: null,
      detail:
        expected !== null
          ? `${matched ?? 0} of ${expected} expected hours`
          : "Matched delivery hours",
      hint: "Data coverage: matched hourly delivery periods divided by expected hourly delivery periods for the selected window.",
      isNoData: !hasMatches || toFiniteNumber(report?.coveragePercent) === null,
    },
  ];

  const cellBorders = [
    "border-b border-neutral-200 sm:border-r xl:border-b-0",
    "border-b border-neutral-200 xl:border-r xl:border-b-0",
    "border-b border-neutral-200 sm:border-r sm:border-b-0",
    "",
  ];

  return (
    <div className="space-y-3">
      {!hasMatches && hasForecasts ? (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-xs leading-5 text-neutral-600">
          Actual generation is not available for this selection yet. Forecast
          values are shown below; error metrics will populate after actuals are
          published.
        </p>
      ) : null}

      <div className="grid grid-cols-1 rounded-xl border border-neutral-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={cellBorders[index]}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>
    </div>
  );
}
