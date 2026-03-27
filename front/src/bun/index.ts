import { RPCType } from "@/shared/types";
import { BrowserView, BrowserWindow, Updater } from "electrobun/bun";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
      );
    }
  }
  return "views://mainview/index.html";
}

// Create the main application window
const url = await getMainViewUrl();

export const rpc = await BrowserView.defineRPC<RPCType>({
  handlers: {
    requests: {},
    messages: {
      closeWindow: () => win.close(),
      minimizeWindow: () => win.minimize(),
      maximizeWindow: () => {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      },
    },
  },
});

const win = new BrowserWindow({
  url,
  title: "React",
  titleBarStyle: "hidden",
  transparent: true,
  frame: {
    width: 1280,
    height: 800,
    x: 60,
    y: 60,
  },
  rpc,
});

console.log("React Tailwind Vite app started!");
