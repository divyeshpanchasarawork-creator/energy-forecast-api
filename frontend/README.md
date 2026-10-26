# Wind Analytics

A focused frontend for evaluating wind generation forecasts against actual generation. The app is built with React, Vite, Tailwind CSS, Recharts, Lucide React, and the native Fetch API.

## Prerequisites

- Node.js 20 or newer
- The existing Spring Boot backend running on `http://localhost:8080`
- Java 21 if you are running the backend locally

## Run locally

Start the backend from the repository root:

```bash
./mvnw spring-boot:run
```

Start the frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

The Vite development server proxies `/api` requests to `http://localhost:8080`, so the browser talks to the backend without a CORS configuration. The same proxy is configured for `npm run preview`.

## Build

```bash
cd frontend
npm run build
npm run preview
```

The production bundle is written to `frontend/dist`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional API origin. Leave it empty to use the Vite proxy. When set, requests go to `${VITE_API_BASE_URL}/api/energy/...`. |

For the deployed split-origin setup, set `VITE_API_BASE_URL` to the Render backend origin. The backend allows browser requests from origins configured through `APP_CORS_ALLOWED_ORIGINS`; local development defaults to the Vite ports, and `render.yaml` initially allows `https://*.vercel.app`.

For tighter security after the frontend is deployed, replace the wildcard on Render with the exact Vercel production origin, for example `https://your-project.vercel.app`.

## Deploy

### Backend on Render

The repository root contains `Dockerfile`, `.dockerignore`, and `render.yaml`.

1. In Render, choose **New > Blueprint** and connect the GitHub repository.
2. Render reads `render.yaml` and creates a Docker web service named `energy-forecast-api`.
3. The service listens on Render's `PORT`, exposes `/actuator/health`, and reads BMRS through the configured base URL.
4. Confirm `https://<render-service>.onrender.com/actuator/health` returns an UP response.
5. Free Render services can sleep and wake with a cold-start delay.

Manual Render settings, if not using the blueprint:

- Runtime: Docker
- Root directory: repository root
- Dockerfile: `./Dockerfile`
- Health check path: `/actuator/health`
- Environment variables:
  - `APP_CORS_ALLOWED_ORIGINS=https://*.vercel.app`
  - `BMRS_API_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1`
  - `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0`

### Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel uses `vercel.json`: Vite framework, `npm run build`, output `dist`.
4. Add `VITE_API_BASE_URL=https://<render-service>.onrender.com` under Project Settings > Environment Variables.
5. Deploy and open the generated Vercel URL.
6. If you want to stop allowing all Vercel preview origins, update `APP_CORS_ALLOWED_ORIGINS` on Render to the exact production Vercel origin and redeploy.

## Backend integration

The app uses the real endpoints:

```text
GET /api/energy/forecast/selected
GET /api/energy/accuracy
```

Both use the same parameters:

- `publishFrom`
- `decisionTime`
- `deliveryFrom`
- `deliveryTo`

All timestamps are ISO-8601 instants. The app requests both endpoints in parallel for the same snapshot. Selected forecasts provide the forecast line and publication times, including for delivery days where actuals are not available yet. Accuracy provides matched actuals, error values, and summary metrics.

The selected forecast response is an array of:

```text
{ dataset, publishTime, startTime, generation }
```

The accuracy response model is:

```text
{
  matchedPeriods,
  mae,
  rmse,
  meanBiasError,
  comparisons: [
    { deliveryTime, forecastGeneration, actualGeneration, error, absoluteError }
  ],
  expectedPeriods,
  coveragePercent
}
```

There is no monthly backtest endpoint in the current backend source. The UI therefore evaluates one delivery day at a time and does not call an invented endpoint.

The accuracy response does not contain a daily breakdown. The accuracy view shows the expected hourly delivery periods with matched, awaiting-actual, or missing status and the per-hour forecast, publication time, actual, and error values.

## Evaluation semantics

- The default delivery day is the next calendar day in **Europe/London**.
- The date picker is capped at the next UK delivery day.
- Delivery boundaries are UK midnight to UK midnight. DST transition days are 23 or 25 hours long.
- The default decision preset is **N2EX at 09:50 Europe/London on D-1**.
- **EPEX GB at 09:20 Europe/London on D-1** is also selectable.
- After gate closure, `decisionTime` is the selected auction cutoff and the UI shows a final gate snapshot.
- Before gate closure, `decisionTime` is the time the page loaded, the UI shows a live preview, and the upcoming cutoff is displayed. This avoids sending a future decision time.
- `publishFrom` is 48 hours before the effective `decisionTime`.
- Forecasts are the latest WINDFOR records published on or before the effective decision time for each delivery hour. Nothing published later is used.
- Actual generation comes from FUELHH WIND records. The backend averages two half-hour settlement periods into an hourly value.
- Forecast-only hours are shown as **Awaiting actual**; they are excluded from error metrics.
- Error is `actual - forecast`. A negative mean bias error indicates overforecasting.
- Coverage is `matchedPeriods / expectedPeriods * 100`, as returned by the backend.
- Missing delivery hours are shown as gaps and are never replaced with zero generation.
- Delivery-hour timestamps are displayed in UTC. Gate closures and delivery-day boundaries use UK local time, with UTC equivalents in the data details.
- Backend metrics are displayed directly. No trend percentages or comparison periods are fabricated.

## States

- Loading and refreshing states are represented in the header and content area.
- The header shows whether the current snapshot is a live preview or a final gate snapshot.
- Upcoming delivery days can show forecasts with actuals marked as pending.
- Empty states explain when no forecast or actual data is available.
- API failures show an error message and a retry action.
- Partial coverage is shown explicitly; missing rows and chart gaps are retained for context.

## Project structure

```text
src/
  components/
    AccuracyTable.jsx
    ApiStatus.jsx
    DashboardHeader.jsx
    DataDetails.jsx
    EmptyState.jsx
    ErrorState.jsx
    EvaluationSummary.jsx
    ForecastActualChart.jsx
    InfoHint.jsx
    LoadingState.jsx
    MetricCard.jsx
    MetricSummary.jsx
    MobileNav.jsx
    Sidebar.jsx
  pages/
    ForecastAccuracy.jsx
    WindOverview.jsx
  services/
    energyApi.js
  utils/
    deliverySeries.js
    formatters.js
    numbers.js
    periods.js
    ukTime.js
  App.jsx
  index.css
  main.jsx
```

## Verification

The frontend build is verified with:

```bash
npm run build
```

The UK time and snapshot logic was checked with temporary project-local scripts covering:

- Winter and summer EPEX/N2EX conversions to UTC
- Live-preview versus passed-cutoff behavior
- 23-hour and 25-hour DST delivery days
- Next UK delivery day and date-picker maximum
- Merging selected forecasts with accuracy comparisons
- Forecast-only upcoming delivery and no-look-ahead publication filtering

There is no committed frontend test suite in this project yet. The backend test suite is unchanged and lives in the Spring Boot project at the repository root.
