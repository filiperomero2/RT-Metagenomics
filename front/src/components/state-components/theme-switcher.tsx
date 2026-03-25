import { useTheme } from "@/theme-provider";
import { Switch } from "@heroui/react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Switch
      defaultSelected
      size="lg"
      isSelected={theme === "dark"}
      onChange={toggle}
      className="w-full"
    >
      <Switch.Content className="w-full">Toggle theme</Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  );
};
