import { RPCSchema } from "electrobun";

// src/shared/types.ts
export type RPCType = {
  // functions that execute in the main process
  bun: RPCSchema<{
    requests: {};
    messages: {
      closeWindow: {};
      minimizeWindow: {};
      maximizeWindow: {};
    };
  }>;
  // functions that execute in the browser context
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};
