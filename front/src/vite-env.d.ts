/// <reference types="vite/client" />

import type * as NeutralinoLib from "../resources/__neutralino_globals";

declare global {
  const Neutralino: typeof NeutralinoLib;
}
