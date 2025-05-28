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

export function Header() {
  const path = usePathname();

  return (
    <Navbar isBordered maxWidth="full">
      <NavbarContent className="flex gap-4 w-full" justify="center">
        <NavbarBrand>
          <NavbarItem className="items-center justify-center flex">
            <Link href="/">
              <img className="bg-background w-10 h-10" src="/logo.webp" />
            </Link>
          </NavbarItem>
        </NavbarBrand>

        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem isActive={path === "/meta"}>
          <Link color="foreground" href="/meta">
            Meta
          </Link>
        </NavbarItem>
        <NavbarItem isActive={path === "/about"}>
          <Link color="foreground" href="/about">
            About
          </Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
