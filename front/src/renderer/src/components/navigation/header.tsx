import { Button, ButtonGroup } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { ChartPie, Copy, Info, Minus, Settings, Square, X } from "lucide-react";
import { BackendStatusButton } from "./backend-status-button";
import { useEffect, useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.api.onIsMaximized(setIsMaximized);
  }, []);

  return (
    <nav
      id="header"
      className="bg-surface app-drag sticky top-0 flex h-[2.75rem] w-full items-center justify-between p-1 select-none"
    >
      <div className="app-no-drag">
        <Button
          isIconOnly
          variant="ghost"
          onPress={() => navigate({ to: "/" })}
        >
          <img className="h-8 w-8" src="/logo.webp" />
        </Button>
      </div>
      <div className="app-no-drag absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-0.5">
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
      <div className="app-no-drag flex">
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
              onClick={() => window.api.minimizeWindow()}
              isIconOnly
              className="rounded-none"
            >
              <Minus size={16} />
            </Button>
            <Button
              onClick={() => window.api.maximizeWindow()}
              className="rounded-none"
            >
              {isMaximized ? <Copy size={16} /> : <Square size={16} />}
            </Button>
            <Button
              aria-label="Close window"
              onClick={() => window.api.closeWindow()}
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
