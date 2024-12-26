import { Flex, Space, Tabs } from '@mantine/core';
import { Download } from '../components/icons/Download';
import Layout from '../components/icons/Layout';
import Music2 from '../components/icons/Music2';
import { iconStyle } from '../util/constants';
import { useI18n } from '../hooks/useI18n/useI18n';
import { AudioPanel } from './AudioPanel';
import { AudioToolbar } from './AudioToolbar';
import { DownloadPanel } from './DownloadPanel';
import { LayoutPanel } from './LayoutPanel';
import Settings from '../components/icons/Settings';
import { OptionsPanel } from './OptionsPanel';

export function MainPanel() {
  const i18n = useI18n()
  return (
    <Tabs defaultValue='audio'>
      <Tabs.List>
        <Tabs.Tab value='audio' leftSection={<Music2 {...iconStyle} />}>{i18n`Audio`}</Tabs.Tab>
        <Tabs.Tab value='options' leftSection={<Settings {...iconStyle} />}>{i18n`Settings`}</Tabs.Tab>
        <Tabs.Tab value='layout' leftSection={<Layout {...iconStyle} />}>{i18n`Layout`}</Tabs.Tab>
        <Flex style={{ flex: 1 }} />
        <Tabs.Tab value='download' leftSection={<Download {...iconStyle} />}>{i18n`Downloads`}</Tabs.Tab>
      </Tabs.List>
      <Space h='xl' />
      <Tabs.Panel value='audio'>
        <AudioToolbar />
        <Space h='sm' />
        <AudioPanel />
        <Space h='xl' />
      </Tabs.Panel>
      <Tabs.Panel value='options'>
        <OptionsPanel />
        <Space h='xl' />
      </Tabs.Panel>
      <Tabs.Panel value='layout'>
        <LayoutPanel />
        <Space h='xl' />
      </Tabs.Panel>
      <Tabs.Panel value='download'>
        <DownloadPanel />
        <Space h='xl' />
      </Tabs.Panel>
    </Tabs>
  );
}
