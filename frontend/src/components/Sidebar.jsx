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

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Wind size={18} strokeWidth={2} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-neutral-900">
            Wind Analytics
          </p>
          <p className="text-[11px] text-neutral-500">Forecast performance</p>
        </div>
      </div>

      <nav aria-label="Primary" className="px-3">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          Analytics
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600/30 ${
                    isActive
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className={
                      isActive ? "text-emerald-700" : "text-neutral-400"
                    }
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-1 px-5 py-5 text-[11px] leading-5 text-neutral-400">
        <p>Delivery hours shown in UTC</p>
        <p>Source: Elexon BMRS</p>
      </div>
    </aside>
  );
}
