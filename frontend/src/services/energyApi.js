import { toFiniteNumber, toInteger } from "../utils/numbers";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "");
const ACCURACY_PATH = "/api/energy/accuracy";
const SELECTED_FORECAST_PATH = "/api/energy/forecast/selected";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function normalizeComparison(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (typeof value.deliveryTime !== "string") {
    return null;
  }

  return {
    deliveryTime: value.deliveryTime,
    forecastGeneration: toFiniteNumber(value.forecastGeneration),
    actualGeneration: toFiniteNumber(value.actualGeneration),
    error: toFiniteNumber(value.error),
    absoluteError: toFiniteNumber(value.absoluteError),
  };
}

function normalizeSelectedForecast(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (
    typeof value.publishTime !== "string" ||
    typeof value.startTime !== "string"
  ) {
    return null;
  }

  const generation = toFiniteNumber(value.generation);

  if (generation === null) {
    return null;
  }

  return {
    dataset: typeof value.dataset === "string" ? value.dataset : "WINDFOR",
    publishTime: value.publishTime,
    startTime: value.startTime,
    generation,
  };
}

export function normalizeAccuracyReport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("The energy API returned an unexpected response.");
  }

  return {
    matchedPeriods: toInteger(value.matchedPeriods),
    mae: toFiniteNumber(value.mae),
    rmse: toFiniteNumber(value.rmse),
    meanBiasError: toFiniteNumber(value.meanBiasError),
    comparisons: Array.isArray(value.comparisons)
      ? value.comparisons.map(normalizeComparison).filter(Boolean)
      : [],
    expectedPeriods: toInteger(value.expectedPeriods),
    coveragePercent: toFiniteNumber(value.coveragePercent),
  };
}

export function normalizeSelectedForecasts(value) {
  if (!Array.isArray(value)) {
    throw new ApiError(
      "The energy API returned an unexpected forecast response.",
    );
  }

  return value.map(normalizeSelectedForecast).filter(Boolean);
}

async function readErrorMessage(response) {
  const status = `${response.status}${
    response.statusText ? ` ${response.statusText}` : ""
  }`;

  try {
    const body = await response.json();
    const detail =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
          : null;

    return detail
      ? `${detail} (${status})`
      : `The energy API request failed (${status}).`;
  } catch {
    return `The energy API request failed (${status}).`;
  }
}

function buildPeriodParams(period) {
  return new URLSearchParams({
    publishFrom: period.publishFrom,
    decisionTime: period.decisionTime,
    deliveryFrom: period.deliveryFrom,
    deliveryTo: period.deliveryTo,
  });
}

async function requestJson(path, period, { signal } = {}) {
  const params = buildPeriodParams(period);
  const url = `${API_BASE_URL}${path}?${params.toString()}`;
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Unable to reach the energy API. Confirm the backend is running and the API base URL or development proxy is configured.",
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(
      "The energy API returned an unreadable response.",
      response.status,
    );
  }
}

export async function fetchForecastAccuracy(period, options = {}) {
  return normalizeAccuracyReport(
    await requestJson(ACCURACY_PATH, period, options),
  );
}

export async function fetchSelectedForecasts(period, options = {}) {
  return normalizeSelectedForecasts(
    await requestJson(SELECTED_FORECAST_PATH, period, options),
  );
}
