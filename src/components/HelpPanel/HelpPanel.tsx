import { Center, Container, Drawer, Loader } from "@mantine/core";
import { Suspense } from "react";
import Markdown from "react-markdown";
// @ts-expect-error - vite-plugin-markdown provides markdown as named export
import { markdown as Readme_de_DE } from "../../../README.de_DE.md";
// @ts-expect-error - vite-plugin-markdown provides markdown as named export
import { markdown as Readme_en_EN } from "../../../README.md";
// @ts-expect-error - vite-plugin-markdown provides markdown as named export
import { markdown as Readme_es_ES } from "../../../README.es_ES.md";
// @ts-expect-error - vite-plugin-markdown provides markdown as named export
import { markdown as Readme_fr_FR } from "../../../README.fr_FR.md";
// @ts-expect-error - vite-plugin-markdown provides markdown as named export
import { markdown as Readme_it_IT } from "../../../README.it_IT.md";
import { useLocale } from "../../hooks/useI18n";
import { useHelpPanel } from "./useHelpPanel";

export function HelpPanel() {
  const [open, setOpen] = useHelpPanel();
  const locale = useLocale();

  return (
    <Drawer
      opened={open}
      onClose={() => setOpen(false)}
      position="top"
      size="100%"
    >
      <Container>
        <Suspense
          fallback={
            <Center>
              <Loader />
            </Center>
          }
        >
          {(() => {
            switch (locale) {
              case "de-DE":
                return <Markdown>{Readme_de_DE}</Markdown>;
              case "es-ES":
                return <Markdown>{Readme_es_ES}</Markdown>;
              case "fr-FR":
                return <Markdown>{Readme_fr_FR}</Markdown>;
              case "it-IT":
                return <Markdown>{Readme_it_IT}</Markdown>;
              default:
                return <Markdown>{Readme_en_EN}</Markdown>;
            }
          })()}
        </Suspense>
      </Container>
    </Drawer>
  );
}
