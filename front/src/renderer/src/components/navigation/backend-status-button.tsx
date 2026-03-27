import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Label,
  Popover,
  Switch,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Circle, Loader, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type {
  BackendProcessEvent,
  BackendState,
} from "../../../../shared/types/backend";

const MAX_LOG_LINES = 200;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function formatExitMessage(event: Extract<BackendProcessEvent, { type: "exit" }>) {
  if (event.signal) {
    return `signal ${event.signal}`;
  }

  return `code ${event.code ?? 0}`;
}

export function BackendStatusButton() {
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [logs, setLogs] = useLocalStorage<string[]>("logs", []);
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

  const appendLog = useCallback((line: string) => {
    if (mirrorRef.current) console.log("[backend]", line);
    setLogs((prev) => {
      const next = [...prev, line];
      return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
    });
  }, [setLogs]);

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
        appendLog(`[system] Failed to read backend state: ${getErrorMessage(error)}`);
      });

    return () => {
      cancelled = true;
    };
  }, [appendLog, startBackend]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
            <Loader size={18} className="animate-spin text-amber-400" />
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
      <Popover.Content offset={15}>
        <Popover.Dialog>
          <Card className="p-0 rounded-none">
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
                {logs.length === 0 ? (
                  <span>No logs yet</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className="break-all whitespace-pre-wrap">
                      {line}
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
