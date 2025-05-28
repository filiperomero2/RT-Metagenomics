"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "../state-components/theme-switcher";
import { Settings } from "lucide-react";

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

        <Popover placement="bottom-end" showArrow>
          <NavbarItem>
            <PopoverTrigger>
              <Button
                disableRipple
                className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                radius="sm"
                variant="light"
                isIconOnly
              >
                <Settings />
              </Button>
            </PopoverTrigger>
          </NavbarItem>
          <PopoverContent aria-label="Settings" className="py-3 px-4">
            <ThemeSwitcher />
          </PopoverContent>
        </Popover>
      </NavbarContent>
    </Navbar>
  );
}
