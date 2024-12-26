import { Grid, type GridProps, Text, Tooltip } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import HelpCircle from '../components/icons/HelpCircle';
import { iconStyle } from "../util/constants";

export type FormFieldProps = PropsWithChildren<{
  label: string;
  tooltip?: ReactNode;
}>

export function FormField({ label, children, tooltip, ...props }: FormFieldProps & GridProps) {
  return (
    <Grid {...props} align='center' mih='3.5rem'>
      <Grid.Col span={3}>
        <Text>
          {label}
          {tooltip &&
            <Tooltip position='right' label={tooltip}>
              <span style={{ paddingLeft: '.5em', position: 'relative', top: '.1em' }}>
                <HelpCircle {...iconStyle} />
              </span>
            </Tooltip>}
        </Text>
      </Grid.Col>
      <Grid.Col span={9}>{children}</Grid.Col>
    </Grid>
  )
}
