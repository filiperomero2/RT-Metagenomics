import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Card } from "@heroui/react";
import {
  ArrowDown,
  ArrowDownToLine,
  ExternalLink,
  Play,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_BACKEND_LOG_LINES } from "../../../../shared/backend-log";
import type {
  BackendLogEntry,
  BackendLogType,
  BackendProcessEvent,
  BackendState,
} from "../../../../shared/types/backend";
import { DetachedWindowHeader } from "./detached-window-header";

type BackendMonitorPanelProps = {
  autoStart?: boolean;
  className?: string;
  detached?: boolean;
  logViewportClassName?: string;
};

const LOG_TYPE_META: Record<
  BackendLogType,
  {
    label: string;
    badgeClassName: string;
    rowClassName: string;
  }
> = {
  system: {
    label: "SYSTEM",
    badgeClassName: "border-default/60 bg-default/80 text-default-foreground",
    rowClassName: "border-l-default bg-default/35",
  },
  info: {
    label: "INFO",
    badgeClassName: "border-accent/40 bg-accent/15 text-accent",
    rowClassName: "border-l-accent bg-accent/10",
  },
  success: {
    label: "SUCCESS",
    badgeClassName: "border-success/40 bg-success/15 text-success",
    rowClassName: "border-l-success bg-success/10",
  },
  warning: {
    label: "WARN",
    badgeClassName: "border-warning/40 bg-warning/15 text-warning",
    rowClassName: "border-l-warning bg-warning/10",
  },
  error: {
    label: "ERROR",
    badgeClassName: "border-danger/40 bg-danger/15 text-danger",
    rowClassName: "border-l-danger bg-danger/10",
  },
  debug: {
    label: "DEBUG",
    badgeClassName: "border-default/60 bg-surface-tertiary text-muted",
    rowClassName: "border-l-default bg-surface-secondary/80",
  },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function formatExitMessage(
  event: Extract<BackendProcessEvent, { type: "exit" }>,
) {
  if (event.signal) {
    return `signal ${event.signal}`;
  }

  return `code ${event.code ?? 0}`;
}

function mergeLogs(base: BackendLogEntry[], extra: BackendLogEntry[]) {
  const merged = [...base];
  const seenIds = new Set(base.map((log) => log.id));

  for (const log of extra) {
    if (!seenIds.has(log.id)) {
      merged.push(log);
      seenIds.add(log.id);
    }
  }

  return merged.slice(-MAX_BACKEND_LOG_LINES);
}

function isNearBottom(element: HTMLDivElement, threshold = 24) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}

export function BackendMonitorPanel({
  autoStart = true,
  className,
  detached = false,
  logViewportClassName,
}: BackendMonitorPanelProps) {
  const [logs, setLogs] = useState<BackendLogEntry[]>([]);
  const [backendState, setBackendState] = useState<BackendState>({
    isRunning: false,
    pid: null,
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logViewportRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const { data: isUp, isError } = useBackendStatus();

  const scrollViewportToBottom = useCallback(() => {
    const viewport = logViewportRef.current;
    if (!viewport) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "auto",
    });

    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  const appendLog = useCallback((entry: BackendLogEntry) => {
    setLogs((prev) => [...prev, entry].slice(-MAX_BACKEND_LOG_LINES));
  }, []);

  const startBackend = useCallback(async () => {
    try {
      const proc = await window.api.startBackend();
      setBackendState({
        isRunning: true,
        pid: proc.pid,
      });
    } catch (error) {
      console.error(
        "Failed to start backend monitor window:",
        getErrorMessage(error),
      );
    }
  }, []);

  const stopBackend = useCallback(async () => {
    try {
      const state = await window.api.stopBackend();
      setBackendState(state);
    } catch (error) {
      console.error(
        "Failed to stop backend monitor window:",
        getErrorMessage(error),
      );
    }
  }, []);

  useEffect(() => {
    return window.api.onBackendProcessEvent((event) => {
      if (event.type === "started") {
        setBackendState({
          isRunning: true,
          pid: event.pid,
        });
        return;
      }

      setBackendState({
        isRunning: false,
        pid: null,
      });
      console.info("[backend]", `Process exited (${formatExitMessage(event)})`);
    });
  }, []);

  useEffect(() => {
    const unsubscribeLog = window.api.onBackendLog((log) => {
      appendLog(log);
    });
    const unsubscribeCleared = window.api.onBackendLogsCleared(() => {
      setLogs([]);
    });

    let cancelled = false;
    void Promise.all([
      window.api.getBackendState(),
      window.api.getBackendLogs(),
    ])
      .then(([state, initialLogs]) => {
        if (cancelled) return;

        setBackendState(state);
        setLogs((prev) => mergeLogs(initialLogs, prev));

        if (autoStart && !state.isRunning) {
          void startBackend();
        }
      })
      .catch((error) => {
        if (cancelled) return;

        console.error(
          "Failed to initialize backend monitor:",
          getErrorMessage(error),
        );
      });

    return () => {
      cancelled = true;
      unsubscribeLog();
      unsubscribeCleared();
    };
  }, [appendLog, autoStart, startBackend]);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    scrollViewportToBottom();
  }, [autoScroll, logs, scrollViewportToBottom]);

  const isRunning = isUp && !isError;
  const hasProcess = backendState.isRunning;

  const getStatusLabel = () => {
    if (isRunning) return "Backend is running";
    return "Backend is offline";
  };

  return (
    <Card className={cn("flex flex-col ", className)}>
      <Card.Header className="flex-row justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          {detached && (
            <div
              className={cn(
                "size-4 rounded-full",
                isRunning ? "bg-green-500" : "bg-red-500",
              )}
            />
          )}
          {getStatusLabel()}
        </span>
        <div className="flex items-center gap-3">
          {!detached && (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => void window.api.openBackendMonitorWindow()}
            >
              <ExternalLink size={14} />
              Detach
            </Button>
          )}

          <Button
            size="sm"
            variant={autoScroll ? "secondary" : "ghost"}
            onPress={() => {
              setAutoScroll((current) => {
                const next = !current;
                if (next) {
                  requestAnimationFrame(scrollViewportToBottom);
                }
                return next;
              });
            }}
          >
            <ArrowDownToLine size={14} />
          </Button>

          {hasProcess ? (
            <Button size="sm" variant="danger-soft" onPress={stopBackend}>
              <Square size={14} />
              Stop
            </Button>
          ) : (
            <Button size="sm" onPress={startBackend}>
              <Play size={14} />
              Start
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Content className="min-h-0 flex-1">
        <div
          ref={logViewportRef}
          className={cn(
            "bg-surface-secondary/50 text-surface-foreground overflow-y-auto rounded-md p-2 font-mono text-xs",
            logViewportClassName ?? "h-[70vh] w-[60vw]",
          )}
          onScroll={(event) => {
            if (!autoScroll) {
              return;
            }

            if (isProgrammaticScrollRef.current) {
              return;
            }

            if (!isNearBottom(event.currentTarget)) {
              setAutoScroll(false);
            }
          }}
        >
          {logs.length === 0 ? (
            <span>No logs yet</span>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "mb-1 flex items-center gap-2 rounded-sm border-l-2 px-2 py-1 break-all whitespace-pre-wrap last:mb-0 select-text",
                  LOG_TYPE_META[log.type].rowClassName,
                )}
              >
                <span
                  className={cn(
                    "inline-flex min-w-11 shrink-0 items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    LOG_TYPE_META[log.type].badgeClassName,
                  )}
                >
                  {LOG_TYPE_META[log.type].label}
                </span>
                <span className="flex-1">{log.line}</span>
              </div>
            ))
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

export function DetachedBackendMonitorWindow() {
  return (
    <div className="text-foreground bg-surface min-h-screen font-sans select-none">
      <DetachedWindowHeader />
      <div className="border-accent/30 bg-background from-background to-surface/80 h-[calc(100vh-2.75rem)] overflow-hidden rounded-t-2xl border-t bg-gradient-to-b p-4">
        <BackendMonitorPanel
          detached
          autoStart={false}
          className="border-accent/20 h-full rounded-xl border shadow-lg"
          logViewportClassName="h-full w-full"
        />
      </div>
    </div>
  );
}
