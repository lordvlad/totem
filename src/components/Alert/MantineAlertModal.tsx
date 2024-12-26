import { Button, Group, Modal } from "@mantine/core";
import { type PropsWithChildren } from "react";

export function MantineAlertModal({ children, resolve }: PropsWithChildren<{ resolve: () => void }>) {
  return (
    <Modal opened={true} onClose={resolve} title="Alert" size="sm" padding="md" withCloseButton={false} >
      {children}
      <Group mt={12} gap={4} style={{ justifyContent: 'flex-end' }}>
        <Button onClick={() => resolve()}>
          Ok
        </Button>
      </Group>
    </Modal>
  )
}
