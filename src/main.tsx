import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { PrintLayout } from "./components/PrintLayout";

export function Main() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications position={"top-center"} />
      <App />
      <PrintLayout />
    </MantineProvider>
  );
}

const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(<Main />);
