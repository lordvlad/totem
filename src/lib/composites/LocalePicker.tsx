import { useState } from "preact/hooks"
import { locales, useLocale } from "../context/i18n/i18n"
import { Button, Popover } from "@geist-ui/core"
import { Globe } from "@geist-ui/icons"

export function LocalePicker() {
  const [locale, setLocale] = useLocale()
  const [isLanguageMenuVisible, setIsLanguageMenuVisible] = useState(false)

  const menu = (
    <>
      <Popover.Item onClick={() => setLocale('en-US')}>English</Popover.Item>
      <Popover.Item onClick={() => setLocale('de-DE')}>Deutsch</Popover.Item>
    </>
  )

  return (
    <Popover visible={isLanguageMenuVisible} content={menu}>
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