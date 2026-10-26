import InfoHint from "./InfoHint";

export default function MetricCard({
  label,
  value,
  unit,
  detail,
  hint,
  isNoData = false,
}) {
  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
          {label}
        </p>
        {hint ? <InfoHint text={hint} /> : null}
      </div>
      <div className="mt-2 flex min-h-8 items-baseline gap-1.5">
        <p
          className={`tabular-nums tracking-tight ${
            isNoData
              ? "text-lg font-medium text-neutral-400"
              : "text-2xl font-semibold text-neutral-900"
          }`}
        >
          {value}
        </p>
        {unit && !isNoData ? (
          <span className="text-xs font-medium text-neutral-500">{unit}</span>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}
