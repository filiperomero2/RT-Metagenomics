import { Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/utils/cn";
import { ChartPie, Info, Settings } from "lucide-react";
import { isMac } from "@/utils/platform";
import { WindowControls } from "./window-controls";
import { BackendStatusButton } from "./backend-status-button";
import logoWebp from "@/../public/logo.webp";

export function Header() {
  const navigate = useNavigate();

  return (
    <nav
      id="header"
      className="bg-surface app-drag sticky top-0 flex h-[2.75rem] w-full items-center justify-between p-1 select-none"
    >
      <div
        className={cn(
          "app-no-drag flex h-full items-center justify-center",
          isMac && "min-w-[5.5rem] justify-start",
        )}
      >
        {isMac ? (
          <WindowControls />
        ) : (
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => navigate({ to: "/" })}
          >
            <img className="h-8 w-8" src={logoWebp} />
          </Button>
        )}
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
      <div className="app-no-drag flex items-center">
        <BackendStatusButton />
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => navigate({ to: "/settings" })}
        >
          <Settings size={16} />
        </Button>
        {isMac ? (
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => navigate({ to: "/" })}
            className="ml-2"
          >
            <img className="h-8 w-8" src={logoWebp} />
          </Button>
        ) : (
          <WindowControls />
        )}
      </div>
    </nav>
  );
}
