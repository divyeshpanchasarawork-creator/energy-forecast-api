import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import MobileNav from "./components/MobileNav";
import Sidebar from "./components/Sidebar";
import ForecastAccuracy from "./pages/ForecastAccuracy";
import WindOverview from "./pages/WindOverview";
import {
  fetchForecastAccuracy,
  fetchSelectedForecasts,
} from "./services/energyApi";
import {
  buildDeliveryPeriod,
  DEFAULT_DECISION_PRESET,
  getDefaultDeliveryDate,
  getMaxDeliveryDate,
} from "./utils/periods";

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate);
  const [decisionPreset, setDecisionPreset] = useState(
    DEFAULT_DECISION_PRESET,
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const period = useMemo(
    () => buildDeliveryPeriod(deliveryDate, decisionPreset, new Date()),
    [deliveryDate, decisionPreset, refreshToken],
  );
  const maxDate = getMaxDeliveryDate();

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setStatus("loading");
    setError(null);

    Promise.all([
      fetchSelectedForecasts(period, { signal: controller.signal }),
      fetchForecastAccuracy(period, { signal: controller.signal }),
    ])
      .then(([forecasts, report]) => {
        if (cancelled) {
          return;
        }

        setData({ forecasts, report, periodKey: period.key });
        setStatus("success");
        setLastUpdated(new Date());
      })
      .catch((requestError) => {
        if (
          cancelled ||
          requestError.name === "AbortError" ||
          requestError.code === "ERR_CANCELED"
        ) {
          return;
        }

        setError(requestError);
        setStatus("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [period]);

  useEffect(() => {
    document.title = `${
      activeView === "overview" ? "Wind Overview" : "Forecast Accuracy"
    } · Wind Analytics`;
  }, [activeView]);

  const hasCurrentData = data?.periodKey === period.key;
  const report = hasCurrentData ? data.report : null;
  const forecasts = hasCurrentData ? data.forecasts : [];
  const apiStatus = error
    ? "error"
    : status === "loading"
      ? report
        ? "refreshing"
        : "loading"
      : "success";

  const handleRefresh = () => {
    setRefreshToken((value) => value + 1);
  };

  const handleDateChange = (nextDate) => {
    setError(null);
    setStatus("loading");
    setDeliveryDate(nextDate);
  };

  const handlePresetChange = (nextPreset) => {
    setError(null);
    setStatus("loading");
    setDecisionPreset(nextPreset);
  };

  let content;

  if (error) {
    content = <ErrorState error={error} onRetry={handleRefresh} />;
  } else if (!report) {
    content = <LoadingState />;
  } else if (activeView === "overview") {
    content = (
      <WindOverview report={report} forecasts={forecasts} period={period} />
    );
  } else {
    content = (
      <ForecastAccuracy report={report} forecasts={forecasts} period={period} />
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="min-w-0 flex-1">
        <MobileNav activeView={activeView} onViewChange={setActiveView} />

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <DashboardHeader
            view={activeView}
            period={period}
            deliveryDate={deliveryDate}
            decisionPreset={decisionPreset}
            maxDate={maxDate}
            onDateChange={handleDateChange}
            onPresetChange={handlePresetChange}
            onRefresh={handleRefresh}
            status={apiStatus}
            lastUpdated={apiStatus === "success" ? lastUpdated : null}
          />

          {content}
        </main>
      </div>
    </div>
  );
}
