import { Button, Menu } from "@mantine/core"
import Globe from "../components/icons/Globe"
import { isKnownLocale, locales, useLocale } from "../util/i18n/i18n"

const sysLocale = navigator.language

export function LocalePicker() {
  const [locale, setLocale] = useLocale()

  return <Menu shadow="md" width={100}>
    <Menu.Target>
      <Button variant="outline" rightSection={<Globe />} > {locales[locale || 'en-US'] || locale} </Button>
    </Menu.Target>
    <Menu.Dropdown>
      {isKnownLocale(sysLocale) && <Menu.Item onClick={() => setLocale(sysLocale)}>Auto</Menu.Item>}
      <Menu.Item onClick={() => setLocale('en-US')}>English</Menu.Item>
      <Menu.Item onClick={() => setLocale('de-DE')}>Deutsch</Menu.Item>
    </Menu.Dropdown>
  </Menu>
}