import { UseFormReturnType } from "@mantine/form";
import type { CommonOptions, CustomOptions } from "../../../hooks/useOptions";
import { CommonOptionsPanel } from "../CommonOptionsPanel";

type CustomLayoutPanelProps = {
  form: UseFormReturnType<CommonOptions | CustomOptions>;
};

export function CustomLayoutPanel({ form }: CustomLayoutPanelProps) {
  return (
    <>
      <CommonOptionsPanel form={form as UseFormReturnType<CommonOptions>} />
      TODO...
    </>
  );
}
