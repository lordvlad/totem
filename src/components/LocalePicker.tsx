import { Button, Menu } from "@mantine/core";
import Globe from "../components/icons/Globe";
import {
  isKnownLocale,
  type Locale,
  locales,
  setLocale,
  useLocale,
  useI18n,
} from "../hooks/useI18n";
import { iconStyle } from "../util/constants";

const sysLocale = navigator.language;

export function LocalePicker() {
  const locale = useLocale();
  const i18n = useI18n();

  return (
    <Menu shadow="md" width={100}>
      <Menu.Target>
        <Button
          variant="outline"
          leftSection={<Globe {...iconStyle} />}
          data-testid="locale-picker-button"
        >
          {" "}
          {locales[locale]}{" "}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {isKnownLocale(sysLocale) && (
          <Menu.Item
            onClick={() => setLocale(sysLocale)}
          >{i18n`Auto (language)`}</Menu.Item>
        )}
        {Object.entries(locales).map(([key, value]) => (
          <Menu.Item key={key} onClick={() => setLocale(key as Locale)}>
            {value}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
