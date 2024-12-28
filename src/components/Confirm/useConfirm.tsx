import { useDisclosure } from "@mantine/hooks";
import { ReactNode, useCallback, useRef } from "react";
import { MantineConfirmModal as ConfirmModal } from "./MantineConfirmModal";

export function useConfirm() {
  const [opened, { open, close }] = useDisclosure();
  const resolve = useRef<(value: boolean) => void>(() => {});
  const children = useRef<ReactNode>(null);
  const element = opened ? (
    <ConfirmModal resolve={resolve.current}>{children.current}</ConfirmModal>
  ) : null;
  const confirm = useCallback((message: ReactNode) => {
    return new Promise<boolean>((res) => {
      children.current = message;
      resolve.current = (val) => {
        res(val);
        close();
      };
      open();
    });
  }, []);

  return { element, confirm };
}
