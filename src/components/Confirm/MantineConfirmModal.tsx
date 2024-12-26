import { Button, Group, Modal } from "@mantine/core";
import { type PropsWithChildren } from "react";

export function MantineConfirmModal({ children, resolve }: PropsWithChildren<{ resolve: (value: boolean) => void }>) {
  return (
    <Modal opened={true} onClose={() => resolve(false)} title="Confirm" size="sm" padding="md" withCloseButton={false} >
      {children}
      <Group mt={12} gap={4} style={{ justifyContent: 'flex-end' }}>
        <Button onClick={() => resolve(false)}>
          Cancel
        </Button>
        <Button onClick={() => resolve(true)} color="red" data-autofocus>
          Confirm
        </Button>
      </Group>
    </Modal>
  )
}
