import { CalendarDays, CalendarRange } from "lucide-react";

const dateInputClass =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition-colors [color-scheme:light] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";

function ModeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600/30 ${
        active
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function RangeControls({
  mode,
  deliveryDate,
  rangeStart,
  rangeEnd,
  maxDate,
  rangeError,
  onModeChange,
  onDateChange,
  onRangeStartChange,
  onRangeEndChange,
  onUseLastSevenDays,
}) {
  const isRange = mode === "range";

  return (
    <div>
      <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
        Date selection
      </span>
      <div className="mt-1.5 flex flex-wrap items-start gap-3">
        <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-neutral-300 bg-neutral-100 p-0.5">
          <ModeButton
            active={!isRange}
            onClick={() => onModeChange("single")}
          >
            Single day
          </ModeButton>
          <ModeButton
            active={isRange}
            onClick={() => onModeChange("range")}
          >
            Range
          </ModeButton>
        </div>

        {isRange ? (
          <>
            <div>
              <label
                htmlFor="range-start"
                className="block text-[11px] font-medium text-neutral-500"
              >
                Start date (UK)
              </label>
              <div className="relative mt-1">
                <CalendarDays
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="range-start"
                  type="date"
                  value={rangeStart}
                  max={maxDate}
                  aria-invalid={rangeError ? "true" : "false"}
                  aria-describedby={rangeError ? "range-error" : undefined}
                  onChange={(event) => {
                    if (event.target.value) {
                      onRangeStartChange(event.target.value);
                    }
                  }}
                  className={`${dateInputClass} sm:w-40`}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="range-end"
                className="block text-[11px] font-medium text-neutral-500"
              >
                End date (UK)
              </label>
              <div className="relative mt-1">
                <CalendarDays
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="range-end"
                  type="date"
                  value={rangeEnd}
                  max={maxDate}
                  aria-invalid={rangeError ? "true" : "false"}
                  aria-describedby={rangeError ? "range-error" : undefined}
                  onChange={(event) => {
                    if (event.target.value) {
                      onRangeEndChange(event.target.value);
                    }
                  }}
                  className={`${dateInputClass} sm:w-40`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onUseLastSevenDays}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-600 shadow-sm outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-emerald-600/30 sm:mt-[18px]"
            >
              <CalendarRange size={14} aria-hidden="true" />
              Last 7 completed days
            </button>
          </>
        ) : (
          <div>
            <label
              htmlFor="delivery-date"
              className="block text-[11px] font-medium text-neutral-500"
            >
              Delivery date (UK)
            </label>
            <div className="relative mt-1">
              <CalendarDays
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                max={maxDate}
                onChange={(event) => {
                  if (event.target.value) {
                    onDateChange(event.target.value);
                  }
                }}
                className={`${dateInputClass} sm:w-40`}
              />
            </div>
          </div>
        )}
      </div>

      {rangeError ? (
        <p
          id="range-error"
          role="alert"
          className="mt-2 text-xs leading-5 text-red-600"
        >
          {rangeError}
        </p>
      ) : null}
    </div>
  );
}
