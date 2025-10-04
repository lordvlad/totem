import { Button, useMantineColorScheme } from "@mantine/core";
import { useMemo } from "react";
import Moon from "../components/icons/Moon";
import Sun from "../components/icons/Sun";
import { useI18n } from "../hooks/useI18n/useI18n";
import { iconStyle } from "../util/constants";
import { SunMoon } from "../components/icons/SunMoon";

const icons = {
  light: <Sun {...iconStyle} />,
  dark: <Moon {...iconStyle} />,
  auto: <SunMoon {...iconStyle} />,
};

export function ThemePicker() {
  const i18n = useI18n();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggle = useCallback(() => {
    setColorScheme(
      ({ light: "dark", dark: "auto", auto: "light" } as const)[colorScheme],
    );
  }, [colorScheme]);

  const labels = useMemo(
    () => {
      return { light: i18n`light`, dark: i18n`dark`, auto: i18n`auto` } as const;
    },
    [i18n],
  );

  return (
    <Button
      w={120}
      variant="outline"
      onClick={toggle}
      leftSection={icons[colorScheme]}
    >
      {labels[colorScheme]}
    </Button>
  );
}
