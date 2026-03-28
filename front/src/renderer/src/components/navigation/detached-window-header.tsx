import { cn } from "@/utils/cn";
import { isMac } from "@/utils/platform";
import { WindowControls } from "./window-controls";

export function DetachedWindowHeader() {
  return (
    <nav className="bg-surface app-drag sticky top-0 flex h-[2.75rem] w-full items-center justify-between p-1 select-none">
      <div
        className={cn(
          "app-no-drag flex h-full items-center gap-2 px-2",
          isMac && "min-w-[5.5rem] justify-start px-0",
        )}
      >
        {isMac ? (
          <WindowControls closeAction="reattach" />
        ) : (
          <>
            <img className="h-8 w-8" src="/logo.webp" />
            <span className="text-sm font-semibold">Backend Monitor</span>
          </>
        )}
      </div>

      <div className="app-no-drag absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="text-muted text-sm font-medium">Detached</span>
      </div>

      <div className="app-no-drag flex items-center gap-2 px-2">
        {isMac ? (
          <>
            <span className="text-sm font-semibold">Backend Monitor</span>
            <img className="h-8 w-8" src="/logo.webp" />
          </>
        ) : (
          <WindowControls closeAction="reattach" />
        )}
      </div>
    </nav>
  );
}
