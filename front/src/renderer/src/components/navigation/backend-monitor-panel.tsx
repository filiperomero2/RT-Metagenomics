import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Card, ToggleButton } from "@heroui/react";
import {
  ArrowDown,
  ArrowDownToLine,
  BrushCleaningIcon,
  Eraser,
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
import { BackendBootstrapProgress } from "./backend-bootstrap-progress";

type BackendMonitorPanelProps = {
  autoStart?: boolean;
  className?: string;
  detached?: boolean;
  logViewportClassName?: string;
  onBeforeDetach?: () => void;
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

function isNearBottom(element: HTMLDivElement, threshold = 48) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}

export function BackendMonitorPanel({
  autoStart = true,
  className,
  detached = false,
  logViewportClassName,
  onBeforeDetach,
}: BackendMonitorPanelProps) {
  const [logs, setLogs] = useState<BackendLogEntry[]>([]);
  const [backendState, setBackendState] = useState<BackendState>({
    isRunning: false,
    pid: null,
    ownership: null,
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logViewportRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const userScrollIntentRef = useRef(false);
  const { data: backendStatus } = useBackendStatus();

  const scrollViewportToBottom = useCallback(() => {
    const viewport = logViewportRef.current;
    if (!viewport) {
      return;
    }

    if (programmaticScrollTimerRef.current !== null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
    }

    isProgrammaticScrollRef.current = true;

    const applyScroll = () => {
      viewport.scrollTop = viewport.scrollHeight;
      lastScrollTopRef.current = viewport.scrollTop;
    };

    applyScroll();
    requestAnimationFrame(() => {
      applyScroll();
      requestAnimationFrame(() => {
        applyScroll();
        programmaticScrollTimerRef.current = window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          programmaticScrollTimerRef.current = null;
        }, 80);
      });
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
        ownership: proc.ownership,
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

  const clearLogs = useCallback(async () => {
    try {
      await window.api.clearBackendLogs();
    } catch (error) {
      console.error("Failed to clear backend logs:", getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    return window.api.onBackendProcessEvent((event) => {
      if (event.type === "started") {
        setBackendState({
          isRunning: true,
          pid: event.pid,
          ownership: "managed",
        });
        return;
      }

      if (event.type === "attached") {
        setBackendState({
          isRunning: true,
          pid: event.pid,
          ownership: "attached",
        });
        return;
      }

      setBackendState({
        isRunning: false,
        pid: null,
        ownership: null,
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
    return () => {
      if (programmaticScrollTimerRef.current !== null) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    scrollViewportToBottom();
  }, [autoScroll, logs, scrollViewportToBottom]);

  useEffect(() => {
    if (!backendStatus?.isRunningProcess || backendState.isRunning) {
      return;
    }

    void window.api.getBackendState().then((state) => {
      if (state.isRunning) {
        setBackendState(state);
      }
    });
  }, [backendStatus?.isRunningProcess, backendState.isRunning]);

  const status = backendStatus?.status ?? "offline";
  const health = backendStatus?.health;
  const isBackendActive =
    backendStatus?.isRunningProcess ?? backendState.isRunning;
  const stopLabel = "Stop";

  const getStatusLabel = () => {
    if (status === "ready") return "Backend is running";
    if (status === "initializing") {
      if (
        typeof health?.progressStep === "number" &&
        typeof health?.progressTotal === "number" &&
        health.progressTotal > 0
      ) {
        return `Database setup · step ${health.progressStep}/${health.progressTotal}`;
      }
      return "Backend loading databases";
    }
    if (status === "degraded") {
      return health?.error
        ? `Backend degraded: ${health.error}`
        : "Backend is running in degraded mode";
    }
    return "Backend is offline";
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <Card.Header className="flex-row justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          {detached && (
            <div
              className={cn(
                "size-4 rounded-full",
                status === "ready" && "bg-success",
                status === "initializing" && "bg-warning",
                status === "degraded" && "bg-warning",
                status === "offline" && "bg-danger",
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
              onPress={() => {
                onBeforeDetach?.();
                void window.api.openBackendMonitorWindow();
              }}
            >
              <ExternalLink size={14} />
              Detach
            </Button>
          )}

          <ToggleButton
            size="sm"
            isSelected={autoScroll}
            onPress={() => {
              setAutoScroll((current) => {
                const next = !current;
                if (next) {
                  userScrollIntentRef.current = false;
                  requestAnimationFrame(scrollViewportToBottom);
                }
                return next;
              });
            }}
          >
            <ArrowDownToLine size={14} />
          </ToggleButton>

          <Button
            size="sm"
            variant="tertiary"
            isDisabled={logs.length === 0}
            onPress={clearLogs}
          >
            <BrushCleaningIcon size={14} />
          </Button>

          {isBackendActive ? (
            <Button size="sm" variant="danger-soft" onPress={stopBackend}>
              <Square size={14} />
              {stopLabel}
            </Button>
          ) : (
            <Button size="sm" onPress={startBackend}>
              <Play size={14} />
              Start
            </Button>
          )}
        </div>
      </Card.Header>

      {(status === "initializing" || status === "degraded") &&
      typeof health?.progressTotal === "number" &&
      health.progressTotal > 0 ? (
        <div className="px-4 pb-2">
          <BackendBootstrapProgress />
        </div>
      ) : null}

      <Card.Content className="min-h-0 flex-1">
        <div
          ref={logViewportRef}
          className={cn(
            "bg-surface-secondary/50 text-surface-foreground overflow-y-auto rounded-md p-2 font-mono text-xs",
            logViewportClassName ?? "h-[70vh] w-[60vw]",
          )}
          onWheel={(event) => {
            if (event.deltaY < 0) {
              userScrollIntentRef.current = true;
            }
          }}
          onScroll={(event) => {
            const viewport = event.currentTarget;
            const scrollTop = viewport.scrollTop;

            if (isProgrammaticScrollRef.current) {
              lastScrollTopRef.current = scrollTop;
              return;
            }

            if (!autoScroll) {
              lastScrollTopRef.current = scrollTop;
              return;
            }

            const scrolledUp = scrollTop + 2 < lastScrollTopRef.current;
            lastScrollTopRef.current = scrollTop;

            if (isNearBottom(viewport)) {
              userScrollIntentRef.current = false;
              return;
            }

            if (userScrollIntentRef.current || scrolledUp) {
              userScrollIntentRef.current = false;
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
                  "mb-1 flex items-center gap-2 rounded-sm border-l-2 px-2 py-1 break-all whitespace-pre-wrap select-text last:mb-0",
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
