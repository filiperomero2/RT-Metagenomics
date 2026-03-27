import { useBackendStatus } from "@/mainview/hooks/use-backend-status";
import { cn } from "@/mainview/utils/cn";
import {
  Button,
  Card,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Circle, Loader, Play, Square, Terminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

const MAX_LOG_LINES = 200;

const BACKEND_CMD = [
  'eval "$(conda shell.bash hook)"',
  "conda activate rt-meta",
  "exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug",
].join(" && ");

export function BackendStatusButton() {
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [logs, setLogs] = useLocalStorage<string[]>("logs", []);
  const [spawnId, setSpawnId] = useLocalStorage<number | null>("spawnId", null);
  const [backendPid, setBackendPid] = useLocalStorage<number | null>(
    "backendPid",
    null,
  );
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
  }, []);

  const startBackend = async () => {
    if (!window.NL_PORT) return;
    setStarting(true);
    setLogs([]);

    appendLog("[system] Activating conda env and starting uvicorn...");
    const proc = await Neutralino.os.spawnProcess(BACKEND_CMD, {
      cwd: "../back/app",
    });
    setSpawnId(proc.id);
    setBackendPid(proc.pid);
    appendLog("[system] Backend process started (PID " + proc.pid + ")");
  };

  const stopBackend = async () => {
    if (!window.NL_PORT) return;
    appendLog("[system] Stopping backend...");

    // 1. Kill the entire process group by PID (children + parent in one shot)
    if (backendPid !== null) {
      try {
        await Neutralino.os.execCommand(
          `kill -TERM -${backendPid} 2>/dev/null; kill -9 -${backendPid} 2>/dev/null`,
        );
      } catch {
        /* already gone */
      }
    }

    // 2. Kill the spawned process via Neutralino as backup
    if (spawnId !== null) {
      try {
        await Neutralino.os.updateSpawnedProcess(spawnId, "SIGKILL");
      } catch {
        /* already gone */
      }
    }

    // 3. Fallback: kill anything still listening on port 8000
    try {
      await Neutralino.os.execCommand(`fuser -k 8000/tcp 2>/dev/null`);
    } catch {
      /* nothing on port or fuser not available */
    }

    setSpawnId(null);
    setBackendPid(null);
    setStarting(false);
    appendLog("[system] Backend stopped");
    qc.invalidateQueries({ queryKey: ["backendStatus"] });
  };

  // Listen for stdout/stderr/exit from the spawned process
  useEffect(() => {
    if (!window.NL_PORT) return;
    const handler = (evt: CustomEvent) => {
      if (spawnId === null || evt.detail.id !== spawnId) return;
      const action: string = evt.detail.action;
      if (action === "stdOut" || action === "stdErr") {
        const text: string = evt.detail.data;
        for (const line of text.split("\n")) {
          if (line.trim()) appendLog(line);
        }
      } else if (action === "exit") {
        appendLog("[system] Process exited (code " + evt.detail.data + ")");
        setSpawnId(null);
        setBackendPid(null);
      }
    };
    Neutralino.events.on("spawnedProcess", handler);
    return () => {
      Neutralino.events.off("spawnedProcess", handler);
    };
  }, [spawnId, appendLog]);

  // // Auto-start on mount
  useEffect(() => {
    if (!spawnId) startBackend();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isRunning = isUp && !isError;
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
                  onChange={setMirrorToConsole}
                >
                  <Switch.Control>
                    <Switch.Thumb>
                    </Switch.Thumb>
                  </Switch.Control>
                  <Switch.Content>
                    <Label>Console</Label>
                  </Switch.Content>
                </Switch>
                {(isRunning || starting) && window.NL_PORT ? (
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
