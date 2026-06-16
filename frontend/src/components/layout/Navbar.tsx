import type { ReactNode } from "react";

interface NavbarProps {
  title: string;
  actions?: ReactNode;
}

export function Navbar({ title, actions }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
