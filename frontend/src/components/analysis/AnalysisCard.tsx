import { TrendingUp, DollarSign, Percent } from "lucide-react";
import type { FinancialAnalysis } from "../../types";

interface AnalysisCardProps {
  analysis: FinancialAnalysis;
}

const METRICS = [
  {
    key: "Revenue" as const,
    label: "Revenue",
    icon: DollarSign,
    format: (v: number) => `₹${v.toLocaleString()}`,
  },
  {
    key: "Net Profit" as const,
    label: "Net Profit",
    icon: TrendingUp,
    format: (v: number) => `₹${v.toLocaleString()}`,
  },
  {
    key: "Profit Margin (%)" as const,
    label: "Profit Margin",
    icon: Percent,
    format: (v: number) => `${v}%`,
  },
];

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Financial Analysis
        </h3>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-800">
        {METRICS.map(({ key, label, icon: Icon, format }) => {
          const value = analysis[key];
          return (
            <div key={key} className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </span>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {format(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
