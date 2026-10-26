import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No matched data", message }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <Inbox size={18} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-neutral-800">{title}</h2>
      <p className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
        {message}
      </p>
    </div>
  );
}
