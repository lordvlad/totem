import { Checkbox, Group, Radio, Select, Space, Tabs } from "@mantine/core";
import { useForm, UseFormReturnType } from "@mantine/form";
import debounce from "lodash.debounce";
import { useCallback, useEffect } from "react";
import { FormField } from "../components/FormField";
import { BookImage } from "../components/icons/BookImage";
import { LayoutGrid } from "../components/icons/LayoutGrid";
import { Table } from "../components/icons/Table";
import { useI18n } from "../hooks/useI18n";
import { useOptions, type AutoOptions, type CommonOptions, type Options, type TileOptions } from "../hooks/useOptions";
import { iconStyle } from "../util/constants";
import { PrintPreview } from "./PrintLayout";

function CommonOptionsPanel({ form }: { form: UseFormReturnType<CommonOptions> }) {
  const i18n = useI18n()
  return (
    <>
      <FormField label={i18n`Paper Size`}>
        <Select
          mt={0.75} {...form.getInputProps('paperSize')}
          data={[i18n`A4`, i18n`A4 landscape`, i18n`letter`]}
        />
      </FormField>
    </>
  )
}

function AutoOptionsPanel({ form }: { form: UseFormReturnType<AutoOptions> }) {
  const i18n = useI18n()
  return (
    <>
      <FormField label={i18n`Features`}>
        <Group>
          <Checkbox {...form.getInputProps('featureCover', { type: 'checkbox' })} label={i18n`Cover`} />
          <Checkbox {...form.getInputProps('featureAlbumInfo', { type: 'checkbox' })} label={i18n`Album Info`} />
          <Checkbox {...form.getInputProps('featureAlbumControls', { type: 'checkbox' })} label={i18n`Album Controls`} />
          <Checkbox {...form.getInputProps('featureTracks', { type: 'checkbox' })} label={i18n`Tracks`} />
          <Checkbox {...form.getInputProps('featureGeneralControls', { type: 'checkbox' })} label={i18n`General Control`} />
        </Group>
      </FormField>
    </>
  )
}


function TileOptionsPanel({ form }: { form: UseFormReturnType<TileOptions> }) {
  const i18n = useI18n()
  return (
    <>
      <FormField label={i18n`Tile Size`} tooltip={i18n`Size of each tile. Useful if you want to cut out the tiles and put them somewhere like a CD case.`}>
        <Radio.Group {...form.getInputProps('tileSize')}>
          <Group>
            <Radio value='1' label='1' />
            <Radio value='1/2' label='1/2' />
            <Radio value='1/3' label='1/3' />
            <Radio value='1/4' label='1/4' />
            <Radio value='1/6' label='1/6' />
            <Radio value='1/12' label='1/12' />
          </Group>
        </Radio.Group>
      </FormField>

      <FormField label={i18n`Item details`}>
        <Group>
          <Checkbox {...form.getInputProps('showAlbumName')} label={i18n`show album name`} />
          <Checkbox {...form.getInputProps('showArtistName')} label={i18n`show artist name`} />
        </Group>
      </FormField>
    </>
  )
}

export function LayoutPanel() {
  const i18n = useI18n()
  const [options, setOptions] = useOptions()
  const form = useForm({
    initialValues: { ...options },
    onValuesChange: useCallback(debounce((values) => setOptions(values), 300), [])
  })

  useEffect(() => {
    form.setValues(options)
  }, [options])

  return (
    <section>
      <Tabs
        defaultValue={form.values.layout}
        onChange={(value) => value && form.setFieldValue('layout', value as Options['layout'])}
      >
        <Tabs.List>
          <Tabs.Tab value="tiles" leftSection={<LayoutGrid {...iconStyle} />}>{i18n`Tiles`}</Tabs.Tab>
          <Tabs.Tab value="table" leftSection={<Table {...iconStyle} />}>{i18n`Table`}</Tabs.Tab>
          <Tabs.Tab value="custom" leftSection={<BookImage {...iconStyle} />}>{i18n`Custom`}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="tiles">
          <Space h='sm' />
          <CommonOptionsPanel form={form as UseFormReturnType<CommonOptions>} />
          <AutoOptionsPanel form={form as UseFormReturnType<AutoOptions>} />
          <TileOptionsPanel form={form as UseFormReturnType<TileOptions>} />
          <PrintPreview />
        </Tabs.Panel>
        <Tabs.Panel value="table">
          <Space h='sm' />
          <CommonOptionsPanel form={form as UseFormReturnType<CommonOptions>} />
          <AutoOptionsPanel form={form as UseFormReturnType<AutoOptions>} />
          TODO ...
        </Tabs.Panel>
        <Tabs.Panel value="custom">
          TODO ...
        </Tabs.Panel>
      </Tabs>
    </section>
  )

}
