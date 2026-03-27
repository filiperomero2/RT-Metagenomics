import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "rt-metagenomics",
		identifier: "rtmetagenomics.app",
		version: "0.0.1",
	},
	build: {
		// Vite builds to dist/, we copy from there
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
			icon: "assets/logo.png",
		},
		win: {
			bundleCEF: false,
			icon: "assets/logo.png",
		},
	},
} satisfies ElectrobunConfig;
