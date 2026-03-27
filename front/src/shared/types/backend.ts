export type BackendState = {
  isRunning: boolean;
  pid: number | null;
};

export type BackendProcessEvent =
  | {
      type: "started";
      pid: number | null;
    }
  | {
      type: "output";
      stream: "stdout" | "stderr";
      line: string;
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
