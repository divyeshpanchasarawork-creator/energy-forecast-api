import { useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import MobileNav from "./components/MobileNav";
import RangeWarning from "./components/RangeWarning";
import Sidebar from "./components/Sidebar";
import ForecastAccuracy from "./pages/ForecastAccuracy";
import WindOverview from "./pages/WindOverview";
import { loadDeliveryRange } from "./services/rangeLoader";
import {
  buildDeliveryRange,
  DEFAULT_DECISION_PRESET,
  getDefaultDeliveryDate,
  getDefaultDeliveryRange,
  getMaxDeliveryDate,
  validateDeliveryRange,
} from "./utils/periods";

function getInitialRange() {
  const fallbackDate = getDefaultDeliveryDate();
  return (
    getDefaultDeliveryRange() ?? {
      startDate: fallbackDate,
      endDate: fallbackDate,
    }
  );
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ERR_CANCELED";
}

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [mode, setMode] = useState("single");
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate);
  const [rangeDates, setRangeDates] = useState(getInitialRange);
  const [decisionPreset, setDecisionPreset] = useState(
    DEFAULT_DECISION_PRESET,
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [progress, setProgress] = useState(null);
  const cacheRef = useRef(new Map());

  const selection = useMemo(() => {
    const now = new Date();
    const rangeError =
      mode === "range"
        ? validateDeliveryRange(
            rangeDates.startDate,
            rangeDates.endDate,
            now,
          )
        : null;

    if (rangeError) {
      return { period: null, rangeError };
    }

    const period =
      mode === "range"
        ? buildDeliveryRange(
            rangeDates.startDate,
            rangeDates.endDate,
            decisionPreset,
            now,
            "range",
          )
        : buildDeliveryRange(
            deliveryDate,
            deliveryDate,
            decisionPreset,
            now,
            "single",
          );

    return { period, rangeError: null };
  }, [
    mode,
    deliveryDate,
    rangeDates,
    decisionPreset,
    refreshToken,
  ]);

  const { period, rangeError } = selection;
  const maxDate = getMaxDeliveryDate();

  useEffect(() => {
    if (!period) {
      setStatus("idle");
      setError(null);
      setProgress(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    setStatus("loading");
    setError(null);
    setProgress({
      completed: 0,
      total: period.dayCount,
      loaded: 0,
      failed: 0,
    });

    loadDeliveryRange(period, {
      signal: controller.signal,
      cache: cacheRef.current,
      onProgress: (nextProgress) => {
        if (!cancelled) {
          setProgress(nextProgress);
        }
      },
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setData({ ...result, periodKey: period.key });
        setStatus("success");
        setLastUpdated(new Date());
      })
      .catch((requestError) => {
        if (cancelled || isAbortError(requestError)) {
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

  const hasCurrentData = Boolean(period && data?.periodKey === period.key);
  const report = hasCurrentData ? data.report : null;
  const forecasts = hasCurrentData ? data.forecasts : [];
  const daily = hasCurrentData ? data.daily : [];
  const failures = hasCurrentData ? data.failures : [];
  const apiStatus = error
    ? "error"
    : rangeError
      ? "idle"
      : status === "loading"
        ? report
          ? "refreshing"
          : "loading"
        : status;

  const handleRefresh = () => {
    cacheRef.current.clear();
    setRefreshToken((value) => value + 1);
  };

  const handleModeChange = (nextMode) => {
    setError(null);
    setStatus("loading");
    setMode(nextMode);
  };

  const handleDateChange = (nextDate) => {
    setError(null);
    setStatus("loading");
    setDeliveryDate(nextDate);
  };

  const handleRangeStartChange = (startDate) => {
    setError(null);
    setStatus("loading");
    setRangeDates((current) => ({ ...current, startDate }));
  };

  const handleRangeEndChange = (endDate) => {
    setError(null);
    setStatus("loading");
    setRangeDates((current) => ({ ...current, endDate }));
  };

  const handleUseLastSevenDays = () => {
    const nextRange = getDefaultDeliveryRange();

    if (nextRange) {
      setError(null);
      setStatus("loading");
      setRangeDates(nextRange);
    }
  };

  const handlePresetChange = (nextPreset) => {
    setError(null);
    setStatus("loading");
    setDecisionPreset(nextPreset);
  };

  let content;

  if (rangeError) {
    content = (
      <ErrorState title="Select a valid date range" message={rangeError} />
    );
  } else if (error) {
    content = <ErrorState error={error} onRetry={handleRefresh} />;
  } else if (!report) {
    const progressMessage =
      progress && period?.isRange
        ? `Checked ${progress.completed} of ${progress.total} delivery days. ${progress.loaded} loaded${
            progress.failed ? `, ${progress.failed} failed` : ""
          }.`
        : undefined;

    content = (
      <LoadingState
        label={
          period?.isRange
            ? `Loading ${period.dayCount}-day delivery range`
            : "Loading forecast data"
        }
        message={progressMessage}
      />
    );
  } else {
    const page =
      activeView === "overview" ? (
        <WindOverview
          report={report}
          forecasts={forecasts}
          period={period}
          daily={daily}
        />
      ) : (
        <ForecastAccuracy
          report={report}
          forecasts={forecasts}
          period={period}
          daily={daily}
        />
      );

    content = (
      <div className="space-y-5">
        <RangeWarning failures={failures} onRetry={handleRefresh} />
        {page}
      </div>
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
            mode={mode}
            deliveryDate={deliveryDate}
            rangeStart={rangeDates.startDate}
            rangeEnd={rangeDates.endDate}
            rangeError={rangeError}
            decisionPreset={decisionPreset}
            maxDate={maxDate}
            onModeChange={handleModeChange}
            onDateChange={handleDateChange}
            onRangeStartChange={handleRangeStartChange}
            onRangeEndChange={handleRangeEndChange}
            onUseLastSevenDays={handleUseLastSevenDays}
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
