import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";
import fs from "fs";

function neutralinoDev(): Plugin {
  return {
    name: "neutralino-dev",
    apply: "serve",
    transformIndexHtml(html) {
      const authPath = path.resolve(__dirname, ".tmp/auth_info.json");
      try {
        const authInfo = JSON.parse(fs.readFileSync(authPath, "utf-8"));
        const globals = `
        <script>
          window.NL_PORT = ${authInfo.nlPort};
          window.NL_TOKEN = "${authInfo.nlToken}";
          window.NL_CTOKEN = "${authInfo.nlConnectToken}";
          window.NL_APPID = "dev.rtmetagenomics.app";
          window.NL_APPVERSION = "0.1.0";
          window.NL_CWD = "${process.cwd().replace(/\\/g, "\\\\")}";
          window.NL_ARGS = ["--url=http://localhost:5173"];
          window.NL_OS = "Linux";
          window.NL_CCOMMIT = "unknown";
          window.NL_CVERSION = "6.5.0";
        </script>`;
        return html.replace("</head>", `${globals}\n  </head>`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss(), neutralinoDev()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      usePolling: !!process.env.WSL_DISTRO_NAME || !!process.env.WSLENV,
    },
  },
});
