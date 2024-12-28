import { proxy, useSnapshot } from "valtio";

export const helpPanelStateProxy = proxy({ open: false });

function setHelpPanelOpen(open: boolean) {
  helpPanelStateProxy.open = open;
}

export function useHelpPanel() {
  const state = useSnapshot(helpPanelStateProxy);
  return [state.open, setHelpPanelOpen] as const;
}
