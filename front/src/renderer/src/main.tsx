import { Providers } from "@/providers";
import { DetachedBackendMonitorWindow } from "@/components/navigation/backend-monitor-panel";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import { routeTree } from "./route-tree.gen";
import "./globals.css";

const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
const isBackendMonitorWindow =
  new URLSearchParams(window.location.search).get("window") ===
  "backend-monitor";

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {isBackendMonitorWindow ? (
      <Providers>
        <DetachedBackendMonitorWindow />
      </Providers>
    ) : (
      <RouterProvider router={router} />
    )}
  </StrictMode>,
);
