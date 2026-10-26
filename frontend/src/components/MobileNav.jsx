import { LineChart, Target, Wind } from "lucide-react";

const navItems = [
  {
    id: "overview",
    label: "Wind Overview",
    icon: LineChart,
  },
  {
    id: "accuracy",
    label: "Forecast Accuracy",
    icon: Target,
  },
];

export default function MobileNav({ activeView, onViewChange }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white md:hidden">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Wind size={16} strokeWidth={2} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-neutral-900">
            Wind Analytics
          </p>
          <p className="text-[10px] text-neutral-500">Forecast performance</p>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="grid grid-cols-2 gap-1 px-3 pb-3"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600/30 ${
                isActive
                  ? "border-neutral-200 bg-neutral-100 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
            >
              <Icon
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
                className={isActive ? "text-emerald-700" : "text-neutral-400"}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
