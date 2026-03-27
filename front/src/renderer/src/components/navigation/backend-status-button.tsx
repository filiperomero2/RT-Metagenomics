import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Card, Label, Popover, Switch } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Circle, Loader, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type {
  BackendProcessEvent,
  BackendState,
} from "../../../../shared/types/backend";

const MAX_LOG_LINES = 200;

type BackendLogType =
  | "system"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "debug";

type BackendLogEntry = {
  type: BackendLogType;
  line: string;
};

type LegacyBackendLogEntry = {
  kind?: string;
  source?: string;
  type?: BackendLogType;
  line: string;
};

type StoredBackendLog = BackendLogEntry | LegacyBackendLogEntry | string;

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
    badgeClassName: "border-surface-tertiary/60 bg-surface-tertiary/80 text-surface-tertiary-foreground",
    rowClassName: "border-l-surface-tertiary bg-surface-tertiary/35",
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

function stripLogPrefix(line: string) {
  const withoutSystemPrefix = line.replace(/^\[system\]\s*/i, "");
  const withoutLevelPrefix = withoutSystemPrefix.replace(
    /^\s*(debug|info|warning|warn|error|critical|success)\s*:\s*/i,
    "",
  );

  return withoutLevelPrefix.trimStart() || withoutSystemPrefix.trimStart() || line;
}

function getLogType(line: string): BackendLogType {
  const normalizedLine = line.trimStart();

  if (/^\[system\]/i.test(normalizedLine)) {
    return "system";
  }

  if (/^(debug|\[debug\]|debug:)/i.test(normalizedLine)) {
    return "debug";
  }

  if (/^(warn|warning|\[warn(?:ing)?\]|warn(?:ing)?:)/i.test(normalizedLine)) {
    return "warning";
  }

  if (/^(error|critical|traceback|\[error\]|\[critical\]|error:|critical:)/i.test(normalizedLine)) {
    return "error";
  }

  if (/^(success|\[success\]|success:)/i.test(normalizedLine)) {
    return "success";
  }

  if (/^(info|\[info\]|info:)/i.test(normalizedLine)) {
    return "info";
  }

  return "info";
}

function normalizeLogEntry(log: StoredBackendLog): BackendLogEntry {
  if (typeof log === "string") {
    return {
      type: getLogType(log),
      line: stripLogPrefix(log),
    };
  }

  if ("kind" in log || "source" in log) {
    return {
      type: getLogType(log.line),
      line: stripLogPrefix(log.line),
    };
  }

  return {
    type: log.type ?? getLogType(log.line),
    line: stripLogPrefix(log.line),
  };
}

function mirrorLogToConsole(type: BackendLogType, line: string) {
  if (type === "error") {
    console.error("[backend]", line);
    return;
  }

  if (type === "warning" || type === "system") {
    console.warn("[backend]", line);
    return;
  }

  console.log("[backend]", line);
}

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

export function BackendStatusButton() {
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [logs, setLogs] = useLocalStorage<StoredBackendLog[]>("logs", []);
  const [backendState, setBackendState] = useState<BackendState>({
    isRunning: false,
    pid: null,
  });
  const logEndRef = useRef<HTMLDivElement>(null);
  const [mirrorToConsole, setMirrorToConsole] = useState(false);
  const mirrorRef = useRef(false);
  const { data: isUp, isError, isLoading } = useBackendStatus();

  useEffect(() => {
    mirrorRef.current = mirrorToConsole;
  }, [mirrorToConsole]);

  const appendLog = useCallback(
    (line: string) => {
      const nextLog = {
        type: getLogType(line),
        line: stripLogPrefix(line),
      } satisfies BackendLogEntry;

      if (mirrorRef.current) {
        mirrorLogToConsole(nextLog.type, nextLog.line);
      }

      setLogs((prev) => {
        const next = [...prev.map(normalizeLogEntry), nextLog];
        return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
      });
    },
    [setLogs],
  );

  const refreshBackendStatus = useCallback(() => {
    return qc.invalidateQueries({ queryKey: ["backend-health"] });
  }, [qc]);

  const startBackend = useCallback(async () => {
    setStarting(true);
    setLogs([]);
    appendLog("[system] Activating conda env and starting uvicorn...");

    try {
      const proc = await window.api.startBackend();
      setBackendState({
        isRunning: true,
        pid: proc.pid,
      });
      appendLog(
        proc.alreadyRunning
          ? `[system] Backend process already running${proc.pid ? ` (PID ${proc.pid})` : ""}`
          : `[system] Backend process started${proc.pid ? ` (PID ${proc.pid})` : ""}`,
      );
      void refreshBackendStatus();
    } catch (error) {
      setStarting(false);
      appendLog(`[system] Failed to start backend: ${getErrorMessage(error)}`);
    }
  }, [appendLog, refreshBackendStatus, setLogs]);

  const stopBackend = useCallback(async () => {
    appendLog("[system] Stopping backend...");
    try {
      await window.api.stopBackend();
      setBackendState({
        isRunning: false,
        pid: null,
      });
      setStarting(false);
      appendLog("[system] Backend stopped");
    } catch (error) {
      appendLog(`[system] Failed to stop backend: ${getErrorMessage(error)}`);
    } finally {
      void refreshBackendStatus();
    }
  }, [appendLog, refreshBackendStatus]);

  useEffect(() => {
    return window.api.onBackendProcessEvent((event) => {
      if (event.type === "started") {
        setBackendState({
          isRunning: true,
          pid: event.pid,
        });
        return;
      }

      if (event.type === "output") {
        appendLog(event.line);
        return;
      }

      setBackendState({
        isRunning: false,
        pid: null,
      });
      setStarting(false);
      appendLog(`[system] Process exited (${formatExitMessage(event)})`);
      void refreshBackendStatus();
    });
  }, [appendLog, refreshBackendStatus]);

  useEffect(() => {
    let cancelled = false;

    void window.api
      .getBackendState()
      .then((state) => {
        if (cancelled) return;

        setBackendState(state);
        if (!state.isRunning) {
          void startBackend();
        }
      })
      .catch((error) => {
        if (cancelled) return;

        setStarting(false);
        appendLog(
          `[system] Failed to read backend state: ${getErrorMessage(error)}`,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appendLog, startBackend]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const normalizedLogs = logs.map(normalizeLogEntry);
  const isRunning = isUp && !isError;
  const hasProcess = backendState.isRunning || starting;

  useEffect(() => {
    if (isRunning) setStarting(false);
  }, [isRunning]);

  const getStatusLabel = () => {
    if (isLoading) return "Checking backend...";
    if (isRunning) return "Backend is running";
    if (starting) return "Starting backend...";
    return "Backend is offline";
  };

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Backend status"
        >
          {isLoading || starting ? (
            <Loader size={18} className="animate-spin text-amber-400 " />
          ) : (
            <Circle
              size={18}
              className={cn(
                "fill-success text-success",
                !isRunning && "fill-danger text-danger",
              )}
            />
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog>
          <Card className="rounded-none p-0">
            <Card.Header className="flex-row justify-between">
              <span className="text-sm font-semibold">{getStatusLabel()}</span>
              <div className="flex items-center gap-4">
                <Switch
                  size="sm"
                  isSelected={mirrorToConsole}
                  onChange={() => setMirrorToConsole((current) => !current)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>Console</Label>
                  </Switch.Content>
                </Switch>
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
            <Card.Content>
              <div className="bg-surface-secondary/50 text-surface-foreground h-[70vh] w-[60vw] overflow-y-auto rounded-md p-2 font-mono text-xs">
                {normalizedLogs.length === 0 ? (
                  <span>No logs yet</span>
                ) : (
                  normalizedLogs.map((log, i) => (
                    <div
                      key={`${log.type}-${i}-${log.line}`}
                      className={cn(
                        "mb-1 flex items-start gap-2 rounded-sm border-l-2 px-2 py-1 break-all whitespace-pre-wrap last:mb-0",
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
                <div ref={logEndRef} />
              </div>
            </Card.Content>
          </Card>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
