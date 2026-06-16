import { useMemo } from "react";

interface StatementCardProps {
  title: string;
  dataJson: string;
}

export function StatementCard({ title, dataJson }: StatementCardProps) {
  const data = useMemo(() => {
    try {
      return JSON.parse(dataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [dataJson]);

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to parse statement data.
        </p>
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between px-6 py-3 text-sm"
          >
            <span className="text-gray-600 dark:text-gray-400">{key}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
              {typeof value === "number"
                ? value.toLocaleString()
                : String(value ?? "—")}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
            No data available.
          </div>
        )}
      </div>
    </div>
  );
}
