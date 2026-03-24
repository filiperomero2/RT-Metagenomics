import {
  Button,
  ButtonGroup,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChartPie, Info, Minus, Settings, Square, X } from "lucide-react";
import { BackendStatusButton } from "./backend-status-button";

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Navbar id="header" maxWidth="full" height="2.7rem" className="bg-content1/40">
      <NavbarBrand>
        <NavbarItem className="flex items-center justify-center">
          <Link to="/">
            <img className="bg-background h-8 w-8" src="/logo.webp" />
          </Link>
        </NavbarItem>
      </NavbarBrand>
      <NavbarContent justify="center">
        <NavbarItem isActive={path === "/meta"} className="text-xs">
          <Link to="/meta" className="text-foreground flex items-center gap-2">
            <ChartPie size={16} />
            Metagenomics
          </Link>
        </NavbarItem>
        <NavbarItem isActive={path === "/about"} className="text-xs">
          <Link to="/about" className="text-foreground flex items-center gap-2">
            <Info size={16} />
            About
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <BackendStatusButton />
        <NavbarItem isActive={path === "/settings"} className="text-xs">
          <Link
            to="/settings"
            className="text-foreground flex items-center gap-2"
          >
            <Settings size={16} />
          </Link>
        </NavbarItem>

        <NavbarItem className="text-xs">
          <ButtonGroup size="sm" variant="light" isIconOnly>
            <Button>
              <Minus size={16} />
            </Button>
            <Button>
              <Square size={16} />
            </Button>
            <Button>
              <X size={16} />
            </Button>
          </ButtonGroup>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
