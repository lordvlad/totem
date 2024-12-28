import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { PrintLayout } from "./components/PrintLayout";

export function Main() {
  return (
    <MantineProvider>
      <Notifications
        style={{ position: "fixed", top: "1em", left: "25%", right: "25%" }}
      />
      <App />
      <PrintLayout />
    </MantineProvider>
  );
}

const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(<Main />);
