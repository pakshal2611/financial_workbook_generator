import { useNavigate } from "react-router-dom";
import { Trash2, FileText } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import type { DocumentListItem } from "../../types";

interface DocumentTableProps {
  documents: DocumentListItem[];
  onDelete: (doc: DocumentListItem) => void;
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Document
            </th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
            </th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              ID
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => navigate(`/documents/${doc.id}`)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {doc.filename}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-6 py-4 text-gray-500 dark:text-gray-400 tabular-nums">
                #{doc.id}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc);
                  }}
                  className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950 dark:hover:text-red-400 cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
