import { UseFormReturnType } from "@mantine/form";
import {
  type AutoOptions,
  type CommonOptions,
  TableOptions,
} from "../../../hooks/useOptions";
import { PrintPreview } from "../../PrintLayout";
import { AutoOptionsPanel } from "../AutoOptionsPanel";
import { CommonOptionsPanel } from "../CommonOptionsPanel";
import { TableOptionsPanel } from "./TableOptionsPanel";

type TableLayoutPanelProps = {
  form: UseFormReturnType<CommonOptions | AutoOptions | TableOptions>;
};

export function TableLayoutPanel({ form }: TableLayoutPanelProps) {
  return (
    <>
      <CommonOptionsPanel form={form as UseFormReturnType<CommonOptions>} />
      <AutoOptionsPanel form={form as UseFormReturnType<AutoOptions>} />
      <TableOptionsPanel form={form as UseFormReturnType<TableOptions>} />
      <PrintPreview />
    </>
  );
}
