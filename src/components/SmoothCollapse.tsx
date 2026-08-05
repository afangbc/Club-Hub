import type { ReactNode } from "react";

export function SmoothCollapse({
  open,
  children,
  openClassName = "mt-3",
}: {
  open: boolean;
  children: ReactNode;
  openClassName?: string;
}) {
  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity,margin] duration-400 ease-out ${
        open ? `${openClassName} grid-rows-[1fr] opacity-100` : "mt-0 grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
