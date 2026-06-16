import { Check } from "lucide-react";

interface WorkflowProgressProps {
  currentStatus: string;
}

const STEPS = [
  { key: "uploaded", label: "Uploaded" },
  { key: "extracted", label: "Text Extracted" },
  { key: "statements", label: "Statements" },
  { key: "analyzed", label: "Analysis" },
  { key: "workbook", label: "Workbook" },
] as const;

const ORDER: Record<string, number> = {
  uploaded: 0,
  extracted: 1,
  statements: 2,
  analyzed: 3,
  workbook: 4,
};

export function WorkflowProgress({ currentStatus }: WorkflowProgressProps) {
  const currentIndex = ORDER[currentStatus] ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5">
        Workflow Progress
      </h3>

      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                    isCompleted
                      ? "bg-indigo-600 text-white"
                      : isCurrent
                      ? "border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-2 border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCompleted || isCurrent
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-3 mt-[-1.25rem] ${
                    index < currentIndex
                      ? "bg-indigo-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
