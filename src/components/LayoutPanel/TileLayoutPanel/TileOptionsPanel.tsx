import { Checkbox, Group, Radio } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useI18n } from "../../../hooks/useI18n";
import { type TileOptions } from "../../../hooks/useOptions";
import { FormField } from "../../FormField";

export type TileOptionsPanelProps = {
  form: UseFormReturnType<TileOptions>;
};

export function TileOptionsPanel({ form }: TileOptionsPanelProps) {
  const i18n = useI18n();
  return (
    <>
      <FormField
        label={i18n`Tile Size`}
        tooltip={i18n`Size of each tile. Useful if you want to cut out the tiles and put them somewhere like a CD case.`}
      >
        <Radio.Group {...form.getInputProps("tileSize")}>
          <Group>
            <Radio value="1" label="1" />
            <Radio value="1/2" label="1/2" />
            <Radio value="1/3" label="1/3" />
            <Radio value="1/4" label="1/4" />
            <Radio value="1/6" label="1/6" />
            <Radio value="1/12" label="1/12" />
          </Group>
        </Radio.Group>
      </FormField>

      <FormField label={i18n`Item details`}>
        <Group>
          <Checkbox
            {...form.getInputProps("showAlbumName")}
            label={i18n`show album name`}
          />
          <Checkbox
            {...form.getInputProps("showArtistName")}
            label={i18n`show artist name`}
          />
        </Group>
      </FormField>
    </>
  );
}
