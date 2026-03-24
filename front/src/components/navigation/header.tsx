import {
  Button,
  ButtonGroup,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import {
  ChartPie,
  Copy,
  Info,
  Maximize2,
  Minus,
  Settings,
  Square,
  X,
} from "lucide-react";
import { BackendStatusButton } from "./backend-status-button";

const DRAG_EXCLUDE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[data-no-drag='true']",
].join(", ");

const DRAG_RETRY_DELAYS_MS = [0, 50, 150];

function isNeutralinoWindow() {
  return typeof window !== "undefined" && Boolean(window.NL_PORT);
}

function isExcludedTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest(DRAG_EXCLUDE_SELECTOR) !== null
  );
}

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isMaximized, setIsMaximized] = useState(false);
  const pendingDragRef = useRef<{ screenX: number; screenY: number } | null>(
    null,
  );
  const isDesktopWindow = isNeutralinoWindow();

  useEffect(() => {
    if (!isDesktopWindow) return;

    let isMounted = true;

    const syncWindowState = async () => {
      try {
        const maximized = await Neutralino.window.isMaximized();
        if (isMounted) setIsMaximized(maximized);
      } catch {
        // Neutralino can briefly be unavailable during hot reloads.
      }
    };

    const retryPendingDrag = () => {
      const pendingDrag = pendingDragRef.current;
      if (!pendingDrag) return;

      void Neutralino.window
        .beginDrag(pendingDrag.screenX, pendingDrag.screenY)
        .catch((error) => {
          console.error("Failed to continue window drag", error);
        });
    };

    const clearPendingDrag = () => {
      pendingDragRef.current = null;
    };

    void syncWindowState();
    window.addEventListener("resize", syncWindowState);
    window.addEventListener("focus", retryPendingDrag);
    window.addEventListener("mouseup", clearPendingDrag);
    window.addEventListener("pointerup", clearPendingDrag);
    window.addEventListener("pointercancel", clearPendingDrag);

    return () => {
      isMounted = false;
      pendingDragRef.current = null;
      window.removeEventListener("resize", syncWindowState);
      window.removeEventListener("focus", retryPendingDrag);
      window.removeEventListener("mouseup", clearPendingDrag);
      window.removeEventListener("pointerup", clearPendingDrag);
      window.removeEventListener("pointercancel", clearPendingDrag);
    };
  }, [isDesktopWindow]);

  const startWindowDrag = async (screenX: number, screenY: number) => {
    if (!isDesktopWindow) return;

    try {
      await Neutralino.window.beginDrag(screenX, screenY);
    } catch (error) {
      console.error("Failed to start window drag", error);
    }
  };

  const toggleMaximize = async () => {
    if (!isDesktopWindow) return;

    try {
      const maximized = await Neutralino.window.isMaximized();

      if (maximized) {
        await Neutralino.window.unmaximize();
      } else {
        await Neutralino.window.maximize();
      }

      setIsMaximized(!maximized);
    } catch (error) {
      console.error("Failed to toggle the window maximized state", error);
    }
  };

  const handleHeaderMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      !isDesktopWindow ||
      isExcludedTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();

    if (document.hasFocus()) {
      pendingDragRef.current = null;
      void startWindowDrag(event.screenX, event.screenY);
      return;
    }

    pendingDragRef.current = {
      screenX: event.screenX,
      screenY: event.screenY,
    };

    void Neutralino.window.focus().catch((error) => {
      pendingDragRef.current = null;
      console.error("Failed to focus the window before dragging", error);
    });

    for (const delay of DRAG_RETRY_DELAYS_MS) {
      window.setTimeout(() => {
        const pendingDrag = pendingDragRef.current;
        if (!pendingDrag) return;

        void startWindowDrag(pendingDrag.screenX, pendingDrag.screenY);
      }, delay);
    }
  };

  const handleHeaderDoubleClick = async (event: MouseEvent<HTMLElement>) => {
    if (!isDesktopWindow || isExcludedTarget(event.target)) return;
    await toggleMaximize();
  };

  const handleMinimize = async () => {
    if (!isDesktopWindow) return;

    try {
      await Neutralino.window.minimize();
    } catch (error) {
      console.error("Failed to minimize the window", error);
    }
  };

  const handleClose = async () => {
    if (!isDesktopWindow) return;

    try {
      await Neutralino.app.exit();
    } catch (error) {
      console.error("Failed to close the application window", error);
    }
  };

  return (
    <Navbar
      id="header"
      maxWidth="full"
      height="2.75rem"
      className="bg-content1 shadow select-none"
      classNames={{wrapper: "p-1"}}
      onDoubleClick={handleHeaderDoubleClick}
      onMouseDownCapture={handleHeaderMouseDown}
    >
      <NavbarBrand>
        <NavbarItem className="flex items-center justify-center">
          <Button isIconOnly variant="light" as={Link} to="/">
            <img className="h-8 w-8" src="/logo.webp" />
          </Button>
        </NavbarItem>
      </NavbarBrand>
      <NavbarContent justify="center" className="gap-0.5">
        <NavbarItem isActive={path === "/meta"} className="text-xs">
          <Button variant="light" size="sm" as={Link} to="/meta">
            <ChartPie size={16} />
            Metagenomics
          </Button>
        </NavbarItem>
        <NavbarItem isActive={path === "/about"} className="text-xs">
          <Button variant="light" size="sm" as={Link} to="/about">
            <Info size={16} />
            About
          </Button>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <BackendStatusButton />
        </NavbarItem>
        <NavbarItem isActive={path === "/settings"} className="text-xs">
          <Button variant="light" size="sm" isIconOnly as={Link} to="/settings">
            <Settings size={16} />
          </Button>
        </NavbarItem>

        {isDesktopWindow ? (
          <NavbarItem className="text-xs h-full flex items-center">
            <ButtonGroup variant="light" isIconOnly radius="none">
              <Button aria-label="Minimize window" onMouseDown={handleMinimize}>
                <Minus size={16} />
              </Button>
              <Button
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
                onMouseDown={toggleMaximize}
              >
                {isMaximized ? <Copy size={16} /> : <Square size={16} />}
              </Button>
              <Button aria-label="Close window" onMouseDown={handleClose} color="danger">
                <X size={16} className="text-foreground" />
              </Button>
            </ButtonGroup>
          </NavbarItem>
        ) : null}
      </NavbarContent>
    </Navbar>
  );
}
