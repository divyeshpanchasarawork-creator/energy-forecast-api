import AccuracyTable from "../components/AccuracyTable";
import DataDetails from "../components/DataDetails";
import EvaluationSummary from "../components/EvaluationSummary";
import MetricSummary from "../components/MetricSummary";

export default function ForecastAccuracy({ report, forecasts, period }) {
  return (
    <div className="space-y-5">
      <MetricSummary report={report} forecasts={forecasts} />
      <EvaluationSummary report={report} forecasts={forecasts} period={period} />
      <AccuracyTable report={report} forecasts={forecasts} period={period} />
      <DataDetails report={report} forecasts={forecasts} period={period} />
    </div>
  );
}
