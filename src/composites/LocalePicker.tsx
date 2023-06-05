import { Button, Popover } from "@geist-ui/core"
import { Globe } from "@geist-ui/icons"
import { useState } from "preact/hooks"
import { Locale, isKnownLocale, locales, useLocale } from "../i18n/i18n"

export function LocalePicker() {
  const [locale, setLocale] = useLocale()
  const [isLanguageMenuVisible, setIsLanguageMenuVisible] = useState(false)

  const sysLocale = navigator.language
  const isSystemLanguageKnown = isKnownLocale(sysLocale)

  const menu = (
    <>
      {isKnownLocale(sysLocale) && <Popover.Item onClick={() => setLocale(sysLocale)}>Auto</Popover.Item>}
      <Popover.Item onClick={() => setLocale('en-US')}>English</Popover.Item>
      <Popover.Item onClick={() => setLocale('de-DE')}>Deutsch</Popover.Item>
    </>
  )

  return (
    // @ts-expect-error
    <Popover visible={isLanguageMenuVisible} content={menu}>
      {/* @ts-expect-error */}
      <Button
        auto
        iconRight={<Globe />}
        onClick={() => setIsLanguageMenuVisible(v => !v)}
      >
        {locales[locale] || locale}
      </Button>
    </Popover>
  )
}