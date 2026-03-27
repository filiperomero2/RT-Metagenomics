export type BackendState = {
  isRunning: boolean;
  pid: number | null;
};

export type BackendLogType =
  | "system"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "debug";

export type BackendLogEntry = {
  id: number;
  type: BackendLogType;
  line: string;
};

export type BackendProcessEvent =
  | {
      type: "started";
      pid: number | null;
    }
  | {
      type: "exit";
      code: number | null;
      signal: string | null;
    };

export type BackendStartResult = {
  alreadyRunning: boolean;
  pid: number | null;
};
