import { Space, Tabs } from "@mantine/core";
import { useForm } from "@mantine/form";
import debounce from "lodash.debounce";
import { useCallback, useEffect } from "react";
import { useI18n } from "../../hooks/useI18n";
import { useOptions, type Options } from "../../hooks/useOptions";
import { iconStyle } from "../../util/constants";
import { BookImage } from "../icons/BookImage";
import { LayoutGrid } from "../icons/LayoutGrid";
import { Table } from "../icons/Table";
import { CustomLayoutPanel } from "./CustomLayoutPanel";
import { TableLayoutPanel } from "./TableLayoutPanel";
import { TileLayoutPanel } from "./TileLayoutPanel";

export function LayoutPanel() {
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
    <section>
      <Tabs
        keepMounted={false}
        value={form.values.layout}
        onChange={(value) =>
          value && form.setFieldValue("layout", value as Options["layout"])
        }
      >
        <Tabs.List>
          <Tabs.Tab
            value="tiles"
            leftSection={<LayoutGrid {...iconStyle} />}
          >{i18n`Tiles`}</Tabs.Tab>
          <Tabs.Tab
            value="table"
            leftSection={<Table {...iconStyle} />}
          >{i18n`Table`}</Tabs.Tab>
          <Tabs.Tab
            value="custom"
            leftSection={<BookImage {...iconStyle} />}
          >{i18n`Custom`}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="tiles">
          <Space h="sm" />
          <TileLayoutPanel form={form} />
        </Tabs.Panel>
        <Tabs.Panel value="table">
          <Space h="sm" />
          <TableLayoutPanel form={form} />
        </Tabs.Panel>
        <Tabs.Panel value="custom">
          <Space h="sm" />
          <CustomLayoutPanel form={form} />
        </Tabs.Panel>
      </Tabs>
    </section>
  );
}
