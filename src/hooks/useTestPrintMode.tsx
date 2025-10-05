import { proxy, useSnapshot } from "valtio";

const testPrintModeProxy = proxy({
  active: false,
});

export function useTestPrintMode() {
  return useSnapshot(testPrintModeProxy);
}

export function activateTestPrintMode() {
  testPrintModeProxy.active = true;
}

export function deactivateTestPrintMode() {
  testPrintModeProxy.active = false;
}
