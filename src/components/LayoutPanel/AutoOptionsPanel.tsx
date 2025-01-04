import { Checkbox, Group } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useI18n } from "../../hooks/useI18n";
import { type AutoOptions } from "../../hooks/useOptions";
import { FormField } from "../FormField";

export type AutoOptionsPanelProps = {
  form: UseFormReturnType<AutoOptions>;
};

export function AutoOptionsPanel({ form }: AutoOptionsPanelProps) {
  const i18n = useI18n();
  return (
    <>
      <FormField label={i18n`Features`}>
        <Group>
          <Checkbox
            {...form.getInputProps("featureCover", { type: "checkbox" })}
            label={i18n`Cover`}
          />
          <Checkbox
            {...form.getInputProps("featureAlbumInfo", { type: "checkbox" })}
            label={i18n`Album Info`}
          />
          <Checkbox
            {...form.getInputProps("featureAlbumControls", {
              type: "checkbox",
            })}
            label={i18n`Album Controls`}
          />
          <Checkbox
            {...form.getInputProps("featureTracks", { type: "checkbox" })}
            label={i18n`Tracks`}
          />
          <Checkbox
            {...form.getInputProps("featureGeneralControls", {
              type: "checkbox",
            })}
            label={i18n`General Control`}
          />
        </Group>
      </FormField>
    </>
  );
}
