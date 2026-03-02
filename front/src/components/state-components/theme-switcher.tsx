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
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Switch
      defaultSelected
      color="primary"
      size="sm"
      isSelected={mounted && theme === "dark"}
      onValueChange={toggle}
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
    />
  );
};
