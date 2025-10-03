import { Checkbox, NumberInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import debounce from "lodash.debounce";
import { useCallback, useEffect } from "react";
import { FormField } from "../components/FormField";
import { useI18n } from "../hooks/useI18n/useI18n";
import { useOptions } from "../hooks/useOptions";

export function OptionsPanel() {
  const i18n = useI18n();
  const [options, setOptions] = useOptions();
  const form = useForm({
    initialValues: { ...options },
    onValuesChange: useCallback(
      debounce((values) => setOptions(values), 300),
      [],
    ),
  });

  useEffect(() => {
    form.setValues(options);
  }, [options]);

  return (
    <>
      <FormField label={i18n`Project Name`}>
        <TextInput mt={0.75} {...form.getInputProps("projectName")} />
      </FormField>

      <FormField
        label={i18n`Product ID`}
        tooltip={i18n`ID of the product. Used to generate the OID codes.`}
      >
        <NumberInput
          min={1}
          max={1000}
          mt={0.75}
          {...form.getInputProps("productId")}
        />
      </FormField>

      <FormField
        label={i18n`OID Code Resolution`}
        tooltip={i18n`Resolution at which OID codes will be generated.`}
      >
        <NumberInput
          mt={0.75}
          {...form.getInputProps("oidCodeResolution")}
          rightSection="DPI"
        />
      </FormField>

      <FormField
        label={i18n`OID Pixel Size`}
        tooltip={i18n`Number of pixels (squared) for each dot in the OID code.`}
      >
        <NumberInput
          mt={0.75}
          {...form.getInputProps("oidCodePixelSize")}
          rightSection="px"
        />
      </FormField>

      <FormField
        label={i18n`"Play All" Code`}
        tooltip={i18n`OID code that will trigger the playback of all tracks.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("playAllOid")}
        />
      </FormField>

      <FormField
        label={i18n`Replay Code`}
        tooltip={i18n`OID code that will trigger the replay of the last track.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("replayOid")}
        />
      </FormField>

      <FormField
        label={i18n`Stop Code`}
        tooltip={i18n`OID code that will stop the current track.`}
      >
        <NumberInput
          min={1}
          max={0xffff}
          mt={0.75}
          {...form.getInputProps("stopOid")}
        />
      </FormField>

      <FormField label={i18n`Debug Mode`} tooltip={i18n`Enable debug mode.`}>
        <Checkbox mt={0.75} {...form.getInputProps("debug")} />
      </FormField>
    </>
  );
}
