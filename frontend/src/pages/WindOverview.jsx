import DataDetails from "../components/DataDetails";
import ForecastActualChart from "../components/ForecastActualChart";
import MetricSummary from "../components/MetricSummary";

export default function WindOverview({ report, forecasts, period }) {
  return (
    <div className="space-y-5">
      <MetricSummary report={report} forecasts={forecasts} />
      <ForecastActualChart
        report={report}
        forecasts={forecasts}
        period={period}
      />
      <DataDetails report={report} forecasts={forecasts} period={period} />
    </div>
  );
}
