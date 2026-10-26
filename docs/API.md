# Energy Forecast API

Reference for the Wind Analytics backend and its frontend integration.

## Base URLs

| Environment | URL |
|---|---|
| Production | `https://energy-forecast-api-c6rc.onrender.com` |
| Local backend | `http://localhost:8080` |
| Local frontend | `http://localhost:5173` |

The machine-readable contract is in [openapi.yaml](./openapi.yaml).

## Quick start

The two business endpoints accept the same four required query parameters:

```bash
BASE=https://energy-forecast-api-c6rc.onrender.com

curl --get "$BASE/api/energy/forecast/selected" \
  --data-urlencode "publishFrom=2026-10-17T08:50:00Z" \
  --data-urlencode "decisionTime=2026-10-19T08:50:00Z" \
  --data-urlencode "deliveryFrom=2026-10-19T23:00:00Z" \
  --data-urlencode "deliveryTo=2026-10-20T23:00:00Z"

curl --get "$BASE/api/energy/accuracy" \
  --data-urlencode "publishFrom=2026-10-17T08:50:00Z" \
  --data-urlencode "decisionTime=2026-10-19T08:50:00Z" \
  --data-urlencode "deliveryFrom=2026-10-19T23:00:00Z" \
  --data-urlencode "deliveryTo=2026-10-20T23:00:00Z"
```

## Request parameters

Both business endpoints require ISO-8601 timestamp parameters.

| Parameter | Required | Meaning |
|---|---|---|
| `publishFrom` | Yes | Earliest forecast publication to retrieve. The frontend uses `decisionTime - 48 hours`. |
| `decisionTime` | Yes | Forecast cut-off. Publications after this instant are excluded. |
| `deliveryFrom` | Yes | Inclusive start of the delivery window. |
| `deliveryTo` | Yes | Exclusive end of the delivery window. |

Constraints:

- `publishFrom` must not be after `decisionTime`.
- `deliveryFrom` must be before `deliveryTo`.
- The accuracy window must contain whole hours.
- Delivery windows are expressed as instants, not UK local time. The frontend converts Europe/London delivery days into UTC instants, including 23-hour and 25-hour DST days.

The frontend defaults to the next UK delivery day in single-day mode and the last seven completed delivery days in range mode. Its cut-offs are:

| Auction | Cut-off |
|---|---|
| EPEX GB | 09:20 Europe/London on the previous day |
| N2EX | 09:50 Europe/London on the previous day |

## Business endpoints

### `GET /api/energy/forecast/selected`

Returns the latest forecast publication per delivery hour, subject to the decision cut-off.

Behavior:

1. Fetches the Elexon `WINDFOR` forecast stream between `publishFrom` and `decisionTime`.
2. Selects the latest publication for each `startTime`.
3. Excludes any publication after `decisionTime`.
4. Keeps records where `deliveryFrom <= startTime < deliveryTo`.
5. Sorts the result by `startTime`.

Response: `200 OK`

```json
[
  {
    "dataset": "WINDFOR",
    "publishTime": "2026-10-19T08:30:00Z",
    "startTime": "2026-10-19T23:00:00Z",
    "generation": 12520.0
  },
  {
    "dataset": "WINDFOR",
    "publishTime": "2026-10-19T08:30:00Z",
    "startTime": "2026-10-20T00:00:00Z",
    "generation": 12810.0
  }
]
```

A normal delivery day contains 24 records. A 23-hour or 25-hour DST day can contain 23 or 25 records.

### `GET /api/energy/accuracy`

Returns matched forecast-versus-actual hourly comparisons and aggregate error metrics.

Behavior:

1. Selects forecasts using the same cut-off and delivery-window rules.
2. Fetches Elexon `FUELHH` actual WIND generation for the UTC dates covering the delivery window.
3. Keeps the latest publication for each half-hour actual.
4. Requires both half-hours for an hour, then averages them into one hourly actual.
5. Matches the hourly actual with the hourly forecast.
6. Calculates `error = actual - forecast`.

Response: `200 OK`

```json
{
  "matchedPeriods": 1,
  "mae": 2520.0,
  "rmse": 2520.0,
  "meanBiasError": -2520.0,
  "comparisons": [
    {
      "deliveryTime": "2026-10-19T23:00:00Z",
      "forecastGeneration": 12520.0,
      "actualGeneration": 10000.0,
      "error": -2520.0,
      "absoluteError": 2520.0
    }
  ],
  "expectedPeriods": 24,
  "coveragePercent": 4.166666666666667
}
```

Metrics:

| Field | Meaning |
|---|---|
| `matchedPeriods` | Hours with both a selected forecast and a complete hourly actual. |
| `expectedPeriods` | Number of whole hours in the requested delivery window. |
| `coveragePercent` | `matchedPeriods / expectedPeriods * 100`. |
| `mae` | Mean absolute error. |
| `rmse` | Root mean squared error. |
| `meanBiasError` | Mean signed error. A negative value means overforecasting. |

Only matched hours appear in `comparisons`. Missing forecasts or incomplete actuals do not create zero-valued rows. If no hours match, the metrics are zero and `comparisons` is empty.

## Error responses

Client errors use a consistent JSON shape:

```json
{
  "timestamp": "2026-10-26T03:15:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "publishFrom must not be after decisionTime",
  "path": "/api/energy/forecast/selected"
}
```

| Status | Meaning |
|---|---|
| `200` | Request succeeded. |
| `400` | Missing or malformed parameter, invalid publication window, invalid delivery window, or partial-hour accuracy window. |
| `405` | HTTP method is not supported for the endpoint. |
| `500` | Unexpected server or upstream failure. |

Unhandled `500` responses use Spring Boot's default error response, so treat the status code as authoritative and do not rely on a fixed error body for those failures.

The API does not currently require authentication or an API key.

## CORS

CORS is configured for `/api/**` only.

- Allowed methods: `GET`, `OPTIONS`
- Allowed request headers: `Accept`, `Content-Type`
- Allowed origins: `APP_CORS_ALLOWED_ORIGINS`
- Preflight cache: 3600 seconds

Production currently allows `https://*.vercel.app`. Local development defaults to the Vite ports on `localhost` and `127.0.0.1`.

Actuator endpoints are not covered by this CORS policy.

## Operational endpoints

These endpoints are provided by Spring Boot Actuator. They are for monitoring and deployment platforms, not for business data.

The Actuator starter is declared in `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

The application exposes only the health endpoint and enables health probes in `application.properties`:

```properties
management.endpoints.web.exposure.include=health
management.endpoint.health.probes.enabled=true
```

| Endpoint | Purpose |
|---|---|
| `GET /actuator` | Actuator discovery index. |
| `GET /actuator/health` | Aggregated application health. |
| `GET /actuator/health/liveness` | Confirms that the process is alive. |
| `GET /actuator/health/readiness` | Confirms that the application is ready to receive traffic. |

`GET /actuator/health` response:

```json
{
  "groups": ["liveness", "readiness"],
  "status": "UP"
}
```

`GET /actuator/health/liveness` and `GET /actuator/health/readiness` return:

```json
{
  "status": "UP"
}
```

Health returns `200` when the status is `UP` and `503` when it is `DOWN`.

Render uses this endpoint as its health check:

```yaml
healthCheckPath: /actuator/health
```

The health check verifies the Spring application and its built-in health indicators. It does not currently call Elexon, so an Elexon outage can cause business requests to fail while `/actuator/health` still reports `UP`.

## Frontend integration

The frontend is a static Vite SPA. It has no HTTP API endpoints or server-side routes of its own.

- `GET /` serves the React application.
- Generated JavaScript and CSS assets are served under `/assets/*`.
- The two dashboard views are state-based tabs, not URL routes.

The frontend calls:

```text
${VITE_API_BASE_URL}/api/energy/forecast/selected
${VITE_API_BASE_URL}/api/energy/accuracy
```

Both requests run in parallel for the same delivery day and snapshot. For a range, the frontend repeats that pair of requests once per delivery day with that day's own gate cutoff, limits concurrency to three days, and caches completed historical days for the session.

If a day fails, the dashboard keeps successful days and shows a warning with the failed dates. If every day fails, the dashboard shows an error state. Changing the selected range aborts obsolete requests so old responses cannot replace the current selection.

In local development, leave `VITE_API_BASE_URL` empty and Vite proxies `/api` to `http://localhost:8080`.

## Upstream Elexon endpoints

The backend calls these endpoints through `BMRS_API_BASE_URL`:

| Endpoint | Parameters |
|---|---|
| `GET /datasets/WINDFOR/stream` | `publishDateTimeFrom`, `publishDateTimeTo` |
| `GET /datasets/FUELHH` | `settlementDateFrom`, `settlementDateTo`, `fuelType=WIND` |

These are internal dependencies and are not exposed as backend endpoints.

## Related documentation

- [Frontend and deployment guide](../frontend/README.md)
- [OpenAPI 3.1 specification](./openapi.yaml)
