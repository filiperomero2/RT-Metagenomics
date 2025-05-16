"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { PieChart } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const path = usePathname();

  return (
    <Navbar isBordered maxWidth="full">
      <NavbarBrand>
        <NavbarItem>
          <Link color="foreground" href="/">
            <PieChart />
          </Link>
        </NavbarItem>
      </NavbarBrand>

      <NavbarContent className="flex gap-4 w-full" justify="center">
        <NavbarItem isActive={path === "/meta"}>
          <Link color="foreground" href="/meta">
            Meta
          </Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
