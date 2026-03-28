import { Button, ButtonGroup, Separator } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { ChartPie, Info, Settings } from "lucide-react";
import { WindowControls } from "./window-controls";
import { BackendStatusButton } from "./backend-status-button";

export function Header() {
  const navigate = useNavigate();

  return (
    <nav
      id="header"
      className="bg-surface app-drag sticky top-0 flex h-[2.75rem] w-full items-center justify-between p-1 select-none"
    >
      <div className="app-no-drag flex h-full items-center justify-center">
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
        <WindowControls />
      </div>
    </nav>
  );
}
