import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/analysis", icon: BarChart3, label: "Analysis" },
  { to: "/workbooks", icon: BookOpen, label: "Workbooks" },
] as const;

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          FinWorkbook
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Financial Workbook Builder
        </p>
      </div>
    </aside>
  );
}
