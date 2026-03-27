declare global {
  interface Window {
    api: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      onIsMaximized: (callback: (isMaximized: boolean) => void) => void;
    };
  }
}

export {};
