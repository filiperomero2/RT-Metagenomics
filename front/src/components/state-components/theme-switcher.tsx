"use client";

import { Switch } from "@heroui/react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme(theme === "rt-meta-dark" ? "rt-meta-light" : "rt-meta-dark");
  };

  return (
    <Switch
      defaultSelected
      color="primary"
      size="sm"
      isSelected={mounted && theme === "rt-meta-dark"}
      onValueChange={toggle}
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
    >
      Toggle theme
    </Switch>
  );
};
