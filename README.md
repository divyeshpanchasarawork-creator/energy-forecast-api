# Wind Analytics

Wind Analytics is a wind-generation forecast evaluation tool for Great Britain. It compares Elexon BMRS wind forecasts with actual wind generation, uses the N2EX or EPEX GB day-ahead gate closure, and reports forecast error and data coverage for a single delivery day or a custom past-date range.

## Live application

| Service | URL |
| --- | --- |
| Web application | https://wind-energy-forecast.vercel.app/ |
| Backend API | https://energy-forecast-api-c6rc.onrender.com/ |
| Backend health | https://energy-forecast-api-c6rc.onrender.com/actuator/health |
| Source code | https://github.com/divyeshpanchasarawork-creator/energy-forecast-api |

The React frontend is hosted on Vercel. The Spring Boot backend is hosted on Render and reads live data from the Elexon BMRS API.

## What it does

- Compares selected WINDFOR wind forecasts with FUELHH actual wind generation.
- Evaluates N2EX 09:50 UK or EPEX GB 09:20 UK day-ahead forecasts.
- Shows a live preview before gate closure and a final snapshot after it.
- Supports historical single days and custom ranges of up to seven delivery days.
- Aggregates MAE, RMSE, MBE, matched hours, expected hours, and coverage across a range.
- Shows a daily breakdown for range analysis.
- Keeps missing or failed days visible instead of treating them as zero generation.

## How the forecast snapshot works

For each delivery day:

1. Gate closure is 09:50 UK for N2EX or 09:20 UK for EPEX GB on the previous day.
2. After gate closure, the backend uses the auction cutoff as `decisionTime`.
3. Before gate closure, the browser uses the page-load time as the live preview snapshot.
4. Only WINDFOR forecasts published on or before that effective decision time are eligible.
5. Actual generation is matched from FUELHH wind records after publication.

Multi-day ranges are deliberately loaded one delivery day at a time. Every day in the range uses its own gate cut-off, so the app never uses a later day's forecast to evaluate an earlier delivery day.

The browser makes two requests per delivery day, with at most three days in flight at once. A seven-day range therefore makes at most fourteen API requests and never requests a new backend endpoint.

## Metrics

Error is defined as:

```text
error = actual generation - forecast generation
```

| Metric | Meaning |
| --- | --- |
| MAE | Mean absolute error across matched hours. Lower is better. |
| RMSE | Root mean squared error. Larger misses have more influence than in MAE. |
| MBE | Mean bias error. Negative means the forecast overpredicted; positive means it underpredicted. |
| Matched hours | Delivery hours with both a selected forecast and an actual value. |
| Expected hours | Delivery hours in the selected period, including 23-hour and 25-hour DST days. |
| Coverage | `matched hours / expected hours × 100`. |

Range metrics are calculated from the underlying hourly comparisons, not by averaging daily metrics. A day with more matched hours therefore contributes proportionally more to the range totals.

Missing actuals are excluded from error metrics. They are never replaced with zero generation. Generation values are shown in MW as returned by BMRS; they are not capacity-normalised.

## Using the application

### 1. Open the application

Open https://wind-energy-forecast.vercel.app/.

The default view is a single delivery day. Use the **Single day** and **Range** controls to switch modes.

### 2. Choose the auction

Use **Auction cutoff** to select:

- **N2EX 09:50 UK** for the N2EX day-ahead auction.
- **EPEX GB 09:20 UK** for the EPEX GB day-ahead auction.

Keep the same auction selected when comparing days. N2EX and EPEX results are not interchangeable.

### 3. Choose a date or range

In **Single day** mode:

1. Select a UK delivery date.
2. Past dates load historical actuals.
3. The next delivery day can show a preview until its gate closure.

In **Range** mode:

1. Select **Start date (UK)** and **End date (UK)**.
2. The range is inclusive and can contain at most seven delivery days.
3. Select **Last 7 completed days** to load the seven most recent completed delivery days.
4. The end date cannot be later than the next UK delivery day.

After gate closure, completed days use final snapshots. Before the next day's cutoff, a range that includes the next day is marked **Mixed final + preview**.

### 4. Review the overview

The **Wind Overview** view shows:

- MAE, RMSE, MBE, and coverage.
- Hourly forecast and actual generation.
- Date-aware chart labels for multi-day ranges.
- Data details, including the delivery window, per-day cutoffs, publication window, and snapshot state.

Missing hours appear as line breaks. They are not plotted as zero.

### 5. Review forecast accuracy

The **Forecast Accuracy** view adds:

- An evaluation summary with matched and expected hours.
- A daily breakdown for ranges.
- A delivery-hour table filtered to all loaded days or one selected day.
- Forecast publication times, actual generation, error, absolute error, and match status.

### 6. Decide with the evidence

A practical decision workflow:

1. **Check coverage before interpreting error.** A low MAE with 40% coverage is not comparable to a high MAE with 100% coverage.
2. **Use MAE and RMSE together.** RMSE much higher than MAE indicates occasional large misses or sharp forecast changes.
3. **Check MBE direction.** Negative MBE means systematic overforecasting. Positive MBE means systematic underforecasting.
4. **Inspect the hourly chart and daily breakdown.** A good aggregate can hide poor overnight, ramp, or single-day performance.
5. **Use ranges for evidence.** Prefer a seven-day view over a single day before changing a trading or operational rule.
6. **Keep the gate consistent.** Compare N2EX with N2EX and EPEX with EPEX.
7. **Wait for final snapshots when possible.** A live preview is useful for early signals but is not a substitute for the final auction state.

## Local development

### Prerequisites

- Java 21
- Node.js 20.19 or newer
- npm

### Start the backend

From the repository root:

```bash
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080` by default.

Check it with:

```bash
curl http://localhost:8080/actuator/health
```

### Start the frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Leave `VITE_API_BASE_URL` empty for local development. Vite proxies `/api` to `http://localhost:8080`.

The same proxy is configured for `npm run preview` on `http://localhost:4173`.

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Vercel or `frontend/.env` | Backend origin. Leave empty locally to use the Vite proxy. |
| `APP_CORS_ALLOWED_ORIGINS` | Render | Comma-separated browser origins allowed by the backend. |
| `BMRS_API_BASE_URL` | Render | Elexon BMRS API base URL. |
| `JAVA_TOOL_OPTIONS` | Render | JVM memory configuration. |

## Testing

### Frontend

```bash
cd frontend
npm test
npm run test:coverage
npm run build
```

The committed frontend suite covers:

- Single-day and multi-day range construction.
- Inclusive range validation and the seven-day limit.
- UK DST boundaries, including 23-hour and 25-hour delivery days.
- Independent per-day gate cutoffs and mixed final/preview ranges.
- Raw-comparison aggregation for MAE, RMSE, MBE, and coverage.
- Comparison and forecast merging, sorting, and deduplication.
- Concurrency limits, cache reuse, partial failures, and retry of only failed days.
- Abort handling when the selection changes.
- Range controls, header summaries, daily breakdowns, partial-failure warnings, and app-level range loading.

`npm run test:coverage` writes an HTML report to `frontend/coverage/`.

### Backend

From the repository root:

```bash
./mvnw test
./mvnw clean package
```

The backend suite covers request validation, error responses, forecast selection, the application context, and the accuracy calculation.

### API contract

```bash
npx --yes @redocly/cli@latest lint docs/openapi.yaml
```

The specification should remain valid. Redocly currently reports style warnings rather than contract errors.

### Manual verification

Before deployment, verify:

1. A single historical N2EX day loads.
2. A single historical EPEX day loads.
3. The last seven completed days load with the expected hour totals.
4. A range crossing the autumn DST change contains a 25-hour day.
5. A range crossing the spring DST change contains a 23-hour day.
6. A range including the next delivery day shows **Mixed final + preview** before its cutoff.
7. Changing the range cancels obsolete requests and does not display old data.
8. A failed day produces a warning while successful days remain visible.
9. The production app loads data from the Render backend.

## Deployment

### Backend on Render

The repository contains `Dockerfile`, `.dockerignore`, and `render.yaml`.

Render uses:

- Docker runtime
- Repository root as the Docker context
- `./Dockerfile`
- `/actuator/health` as the health check
- `APP_CORS_ALLOWED_ORIGINS=https://*.vercel.app`
- `BMRS_API_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1`

The free Render service can sleep. The first request after inactivity may take longer while the service starts.

Health endpoints:

```text
GET /actuator/health
GET /actuator/health/liveness
GET /actuator/health/readiness
```

Health reports whether the Spring Boot application is running. It does not prove that Elexon is currently reachable.

### Frontend on Vercel

Vercel uses:

- Root Directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_BASE_URL=https://energy-forecast-api-c6rc.onrender.com`

The production origin is `https://wind-energy-forecast.vercel.app`. The backend currently allows `https://*.vercel.app` so preview deployments also work. For stricter production-only CORS, set `APP_CORS_ALLOWED_ORIGINS` on Render to the exact production origin.

## API reference

- [Endpoint guide](docs/API.md)
- [OpenAPI 3.1 specification](docs/openapi.yaml)

The frontend uses:

```text
GET /api/energy/forecast/selected
GET /api/energy/accuracy
```

Both endpoints require:

- `publishFrom`
- `decisionTime`
- `deliveryFrom`
- `deliveryTo`

Invalid parameters now return a consistent JSON `400` response. Unsupported HTTP methods return a consistent `405` response.

## Project structure

```text
.
├── docs/
│   ├── API.md
│   └── openapi.yaml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── test/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── src/
│   ├── main/
│   └── test/
├── Dockerfile
├── render.yaml
└── README.md
```

## Data limitations

- WINDFOR is a forecast dataset, not a guarantee of delivered generation.
- FUELHH actuals can be revised upstream.
- Coverage can be incomplete during outages, revisions, or near-real-time publication.
- Forecast error in MW is not the same as forecast error as a percentage of capacity.
- Results depend on the auction gate, forecast dataset, and selected delivery date.
- Very old dates may have limited or unavailable actual generation.
- A single day is not enough evidence for a rule change; use a range where possible.
- The application does not model prices, imbalance, curtailment, or settlement.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API error in the header | Confirm the Render service is awake and `/actuator/health` is `UP`. |
| No data for a date | Try a more recent historical day or a different range. Elexon may not have complete data. |
| Live preview shows no actuals | Actual generation is not available yet. Wait for publication and refresh. |
| Range warning lists failed days | Use **Retry failed days**. Successful cached days are reused. |
| CORS failure in the browser | Confirm `APP_CORS_ALLOWED_ORIGINS` includes the frontend origin. |
| First load is slow | The free Render service may be waking from sleep. |
| Local `/api` requests fail | Confirm the backend is running on port 8080 and restart `npm run dev`. |
