import { UseFormReturnType } from "@mantine/form";
import type {
  AutoOptions,
  CommonOptions,
  TileOptions,
} from "../../../hooks/useOptions";
import { PrintPreviewWrapper } from "../../PrintLayout";
import { AutoOptionsPanel } from "../AutoOptionsPanel";
import { CommonOptionsPanel } from "../CommonOptionsPanel";
import { TileOptionsPanel } from "./TileOptionsPanel";

type TileLayoutPanelProps = {
  form: UseFormReturnType<TileOptions | CommonOptions | AutoOptions>;
};

export function TileLayoutPanel({ form }: TileLayoutPanelProps) {
  return (
    <>
      <CommonOptionsPanel form={form as UseFormReturnType<CommonOptions>} />
      <AutoOptionsPanel form={form as UseFormReturnType<AutoOptions>} />
      <TileOptionsPanel form={form as UseFormReturnType<TileOptions>} />
      <PrintPreviewWrapper />
    </>
  );
}
