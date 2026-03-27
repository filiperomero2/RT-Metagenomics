import { RPCType } from "@/shared/types";
import { Electroview } from "electrobun/view";

const rpc = Electroview.defineRPC<RPCType>({
  handlers: {
    messages: {},
    requests: {},
  },
  maxRequestTime: 60000,
});

const electroview = new Electroview({ rpc });

export const nativeFunctions = {
  closeWindow: () => electroview.rpc?.send.closeWindow({}),
  minimizeWindow: () => electroview.rpc?.send.minimizeWindow({}),
  maximizeWindow: () => electroview.rpc?.send.maximizeWindow({}),
};
