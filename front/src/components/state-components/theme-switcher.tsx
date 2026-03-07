import { Switch } from "@heroui/react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/theme-provider";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Switch
      defaultSelected
      color="primary"
      size="sm"
      isSelected={theme === "dark"}
      onValueChange={toggle}
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
    />
  );
};
