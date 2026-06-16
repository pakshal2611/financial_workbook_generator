interface StatusBadgeProps {
  status: string;
}

const CONFIG: Record<string, { label: string; color: string }> = {
  uploaded: {
    label: "Uploaded",
    color: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/30",
  },
  extracted: {
    label: "Text Extracted",
    color: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/30",
  },
  statements: {
    label: "Statements Ready",
    color: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-400/30",
  },
  analyzed: {
    label: "Analyzed",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30",
  },
  workbook: {
    label: "Workbook Ready",
    color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-400/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? {
    label: status,
    color: "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-400/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
