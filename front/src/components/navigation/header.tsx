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
      <NavbarContent className="flex w-full gap-4" justify="center">
        <NavbarBrand>
          <NavbarItem className="flex items-center justify-center">
            <Link href="/">
              <img className="bg-background h-10 w-10" src="/logo.webp" />
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

        <Dropdown placement="bottom-end" showArrow>
          <NavbarItem>
            <DropdownTrigger>
              <Button
                disableRipple
                className="bg-transparent p-0 data-[hover=true]:bg-transparent"
                radius="sm"
                variant="light"
                isIconOnly
              >
                <Settings />
              </Button>
            </DropdownTrigger>
          </NavbarItem>
          <DropdownMenu aria-label="Settings" className="px-4 py-3">
            <DropdownItem key={"theme-switcher"} isReadOnly>
              <ThemeSwitcher />
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
