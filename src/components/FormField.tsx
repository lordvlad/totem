import { Grid, type GridContainerProps, Text, Tooltip } from "@geist-ui/core";
import { HelpCircle } from "@geist-ui/icons";
import { ComponentChildren } from "preact";

export type FormFieldProps = {
    label: string;
    children: ComponentChildren;
    tooltip?: ComponentChildren;
};

export function FormField({ label, children, tooltip, ...props }: FormFieldProps & GridContainerProps) {
    return (
        // @ts-expect-error
        <Grid.Container {...props}>
            <Grid md={6}>
                <Text>
                    {label}
                    {tooltip &&
                        <Tooltip placement="rightStart" text={tooltip}>
                            <span style={{ paddingLeft: ".5em", position: "relative", top: ".25em" }}>
                                <HelpCircle size={20} />
                            </span>
                        </Tooltip>
                    }
                </Text>
            </Grid>
            <Grid md={18}>{children}</Grid>
        </Grid.Container>
    )
}
