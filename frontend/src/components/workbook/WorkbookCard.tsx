import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "../ui/Button";

interface WorkbookCardProps {
  filePath: string | null;
  loading: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

export function WorkbookCard({
  filePath,
  loading,
  onGenerate,
  onDownload,
}: WorkbookCardProps) {
  const hasWorkbook = !!filePath;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Excel Workbook
        </h3>
      </div>
      <div className="p-6">
        {hasWorkbook ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Workbook Generated
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filePath?.split("/").pop()}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={onDownload}
            >
              Download
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 mb-3">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No workbook generated yet.
            </p>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={onGenerate}
            >
              Generate Workbook
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
