import "./app.css";

import { AppShell, AppShellProps, Container } from "@mantine/core";

import { useDocumentTitle } from "@mantine/hooks";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { HelpPanel } from "../HelpPanel";
import { MainPanel } from "../MainPanel";
import { useOptions } from "../../hooks/useOptions";
import { useProjectInitialization } from "../../hooks/useProjectInitialization";

export function App(
  props: Omit<
    AppShellProps,
    "children" | "header" | "footer" | "aside" | "navbar"
  >,
) {
  const { projectName } = useOptions()[0];
  useProjectInitialization();

  useDocumentTitle(`Totem - ${projectName}`);

  return (
    <AppShell className="no-print app-inner" {...props}>
      <Container>
        <HelpPanel />
        <AppHeader />
        <MainPanel />
        <AppFooter />
      </Container>
    </AppShell>
  );
}
