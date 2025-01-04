import { Select } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useI18n } from "../../hooks/useI18n";
import { CommonOptions } from "../../hooks/useOptions";
import { FormField } from "../FormField";

export type CommonOptionsPanelProps = {
  form: UseFormReturnType<CommonOptions>;
};

export function CommonOptionsPanel({ form }: CommonOptionsPanelProps) {
  const i18n = useI18n();
  return (
    <>
      <FormField label={i18n`Paper Size`}>
        <Select
          mt={0.75}
          {...form.getInputProps("paperSize")}
          data={[i18n`A4`, i18n`A4 landscape`, i18n`letter`]}
        />
      </FormField>
    </>
  );
}
