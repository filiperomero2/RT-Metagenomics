import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { ProgressBar } from "@heroui/react";

type BackendBootstrapProgressProps = {
  className?: string;
  compact?: boolean;
};

function getBootstrapPercent(
  phase: string | undefined,
  step: number,
  total: number,
): number {
  if (phase === "ready") {
    return 100;
  }
  if (total <= 0 || step <= 0) {
    return 0;
  }
  // Keep the bar below 100% until bootstrap fully completes.
  return Math.min(95, Math.round((step / total) * 90));
}

export function BackendBootstrapProgress({
  className,
  compact = false,
}: BackendBootstrapProgressProps) {
  const { data: backendStatus } = useBackendStatus();
  const health = backendStatus?.health;
  const status = backendStatus?.status;

  if (
    status !== "initializing" &&
    status !== "degraded" &&
    health?.phase !== "bootstrapping_databases"
  ) {
    return null;
  }

  const step = health?.progressStep ?? 0;
  const total = health?.progressTotal ?? 0;
  const progressText = health?.progressText?.trim();
  const downloadLabel = health?.downloadLabel;
  const downloadLoaded = health?.downloadLoaded;
  const downloadTotal = health?.downloadTotal;
  const downloadSpeed = health?.downloadSpeed;
  const downloadPercent = health?.downloadPercent;

  if (total <= 0) {
    return null;
  }

  const percent = getBootstrapPercent(health?.phase, step, total);
  const stepLabel =
    step > 0 && total > 0 ? `Step ${step} of ${total}` : "Setting up databases";

  const downloadSizeText =
    downloadLoaded && downloadTotal
      ? `${downloadLoaded} / ${downloadTotal}`
      : downloadTotal
        ? `Size: ${downloadTotal}`
        : downloadLoaded
          ? `${downloadLoaded} downloaded`
          : null;

  const downloadLine =
    downloadLabel && downloadSizeText
      ? `${downloadLabel} · ${downloadSizeText}${downloadSpeed ? ` · ${downloadSpeed}` : ""}`
      : downloadLabel
        ? `Starting ${downloadLabel}…`
        : null;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {!compact ? (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-warning font-medium">{stepLabel}</span>
          <span className="text-muted shrink-0">{percent}%</span>
        </div>
      ) : null}

      <ProgressBar
        aria-label="Database setup progress"
        value={percent}
        maxValue={100}
        size="sm"
        color="warning"
        className="gap-1"
      >
        <ProgressBar.Track className={cn("rounded-full", compact ? "h-1.5" : "h-2.5")}>
          <ProgressBar.Fill className="transition-[width] duration-500 ease-out" />
        </ProgressBar.Track>
      </ProgressBar>

      {progressText ? (
        <p className={cn("text-muted truncate", compact ? "text-[11px]" : "text-xs")}>
          {progressText}
        </p>
      ) : null}

      {downloadLine ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className={cn("text-accent truncate", compact ? "text-[11px]" : "text-xs")}>
            {downloadLine}
          </p>
          {typeof downloadPercent === "number" ? (
            <ProgressBar
              aria-label="File download progress"
              value={downloadPercent}
              maxValue={100}
              size="sm"
              color="accent"
              className="gap-1"
            >
              <ProgressBar.Track className={cn("rounded-full", compact ? "h-1" : "h-1.5")}>
                <ProgressBar.Fill className="transition-[width] duration-300 ease-out" />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
