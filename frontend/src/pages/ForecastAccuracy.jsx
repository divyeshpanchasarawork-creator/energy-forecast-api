import AccuracyTable from "../components/AccuracyTable";
import DailyBreakdown from "../components/DailyBreakdown";
import DataDetails from "../components/DataDetails";
import EvaluationSummary from "../components/EvaluationSummary";
import MetricSummary from "../components/MetricSummary";

export default function ForecastAccuracy({
  report,
  forecasts,
  period,
  daily = [],
}) {
  return (
    <div className="space-y-5">
      <MetricSummary report={report} forecasts={forecasts} />
      <EvaluationSummary report={report} forecasts={forecasts} period={period} />
      {period.dayCount > 1 ? <DailyBreakdown daily={daily} /> : null}
      <AccuracyTable
        report={report}
        forecasts={forecasts}
        period={period}
        daily={daily}
      />
      <DataDetails report={report} forecasts={forecasts} period={period} />
    </div>
  );
}
