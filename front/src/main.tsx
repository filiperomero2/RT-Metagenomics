import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./globals.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

function renderApp() {
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

if (window.NL_PORT) {
  window.addEventListener(
    "ready",
    () => {
      const focusWindow = () => {
        void Neutralino.window.focus().catch(() => {
          // Ignore startup focus races in the desktop shell.
        });
      };

      renderApp();
      window.setTimeout(focusWindow, 0);
      window.setTimeout(focusWindow, 150);
    },
    { once: true },
  );

  Neutralino.init();
} else {
  renderApp();
}
