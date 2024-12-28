import { useDisclosure } from "@mantine/hooks";
import { ReactNode, useCallback, useRef } from "react";
import { MantineAlertModal as AlertModal } from "./MantineAlertModal";

export function useAlert() {
  const [opened, { open, close }] = useDisclosure();
  const resolve = useRef<() => void>(() => {});
  const children = useRef<ReactNode>(null);
  const element = opened ? (
    <AlertModal resolve={resolve.current}>{children.current}</AlertModal>
  ) : null;
  const alert = useCallback((message: ReactNode) => {
    return new Promise<void>((res) => {
      children.current = message;
      resolve.current = () => {
        res();
        close();
      };
      open();
    });
  }, []);

  return { element, alert };
}
