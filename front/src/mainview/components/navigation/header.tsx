import { Button, ButtonGroup } from "@heroui/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChartPie, Copy, Info, Minus, Settings, Square, X } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { BackendStatusButton } from "./backend-status-button";
import { nativeFunctions } from "@/mainview/utils/electrobun";

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
  const navigate = useNavigate();

  return (
    <nav
      id="header"
      className="bg-surface electrobun-webkit-app-region-drag relative flex h-[2.75rem] w-full items-center justify-between p-1 select-none"
      onDoubleClick={nativeFunctions.maximizeWindow}
    >
      <div className="electrobun-webkit-app-region-no-drag">
        <Button
          isIconOnly
          variant="ghost"
          onPress={() => navigate({ to: "/" })}
        >
          <img className="h-8 w-8" src="/logo.webp" />
        </Button>
      </div>
      <div className="electrobun-webkit-app-region-no-drag absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => navigate({ to: "/meta" })}
        >
          <ChartPie size={16} />
          Metagenomics
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => navigate({ to: "/about" })}
        >
          <Info size={16} />
          About
        </Button>
      </div>
      <div className="electrobun-webkit-app-region-no-drag flex">
        <BackendStatusButton />
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => navigate({ to: "/settings" })}
        >
          <Settings size={16} />
        </Button>

        <div className="flex h-full items-center text-xs">
          <ButtonGroup variant="ghost">
            <Button
              aria-label="Minimize window"
              onMouseDown={nativeFunctions.minimizeWindow}
              isIconOnly
              className="rounded-none"
            >
              <Minus size={16} />
            </Button>
            <Button
              onMouseDown={nativeFunctions.maximizeWindow}
              className="rounded-none"
            >
              {/* {isMaximized ? <Copy size={16} /> : <Square size={16} />} */}
            </Button>
            <Button
              aria-label="Close window"
              onMouseDown={nativeFunctions.closeWindow}
              className="hover:bg-danger rounded-none"
            >
              <X size={16} className="text-foreground" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </nav>
  );
}
