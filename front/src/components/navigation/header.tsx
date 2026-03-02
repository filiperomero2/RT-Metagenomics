"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "../state-components/theme-switcher";
import { ChartPie, Info, Settings } from "lucide-react";

export function Header() {
  const path = usePathname();

  return (
    <Navbar isBordered maxWidth="full">
      <NavbarContent className="flex w-full gap-4" justify="center">
        <NavbarBrand>
          <NavbarItem className="flex items-center justify-center">
            <Link href="/">
              <img className="bg-background h-10 w-10" src="/logo.webp" />
            </Link>
          </NavbarItem>
        </NavbarBrand>

        <NavbarItem isActive={path === "/meta"}>
          <Link
            color="foreground"
            href="/meta"
            className="flex items-center gap-2"
          >
            <ChartPie size={18} />
            Meta
          </Link>
        </NavbarItem>
        <NavbarItem isActive={path === "/about"}>
          <Link
            color="foreground"
            href="/about"
            className="flex items-center gap-2"
          >
            <Info size={18} />
            About
          </Link>
        </NavbarItem>
        <NavbarItem isActive={path === "/settings"}>
          <Link
            color="foreground"
            href="/settings"
            className="flex items-center gap-2"
          >
            <Settings size={18} />
            Settings
          </Link>
        </NavbarItem>
        <ThemeSwitcher />
      </NavbarContent>
    </Navbar>
  );
}
