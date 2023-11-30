import { Checkbox, Container, Drawer, Grid, GridProps, Group, NumberInput, Radio, Select, Text, Title, Tooltip } from '@mantine/core'
import { useForm } from '@mantine/form'
import { PropsWithChildren, ReactNode } from 'react'
import HelpCircle from '../components/icons/HelpCircle'
import { PrintPreview } from '../pages/PrintLayout'
import { initialPrintOptions, useOptionsPanel } from '../stores/options'
import { useI18n } from '../util/i18n/i18n'
import { useLocalStorage } from '@mantine/hooks'

export type FormFieldProps = PropsWithChildren<{
    label: string;
    tooltip?: ReactNode;
}>;

function FormField({ label, children, tooltip, ...props }: FormFieldProps & GridProps) {
    return (
        <Grid {...props} align='center' mih="3.5rem">
            <Grid.Col span={3} >
                <Text>
                    {label}
                    {tooltip &&
                        <Tooltip position="right" label={tooltip}>
                            <span style={{ paddingLeft: ".5em", position: "relative", top: ".25em" }}>
                                <HelpCircle height={20} width={20} />
                            </span>
                        </Tooltip>
                    }
                </Text>
            </Grid.Col>
            <Grid.Col span={9}>{children}</Grid.Col>
        </Grid>
    )
}


export function OptionsPanel() {
    const i18n = useI18n()
    const [showOptionsPanel, setShowOptionsPanel] = useOptionsPanel()

    const [options, setOptions] = useLocalStorage({ key: 'options', defaultValue: initialPrintOptions })

    const form = useForm({
        initialValues: options,
        validateInputOnBlur: true,
        validateInputOnChange: true,
        transformValues: (values) => {
            setOptions(values)
            return values;
        },
    })

    return (
        <Drawer opened={showOptionsPanel} onClose={() => setShowOptionsPanel(false)} position="top" size="100%">
            <Container>
                <Title my="lg" order={2}>{i18n`OID Code Settings`}</Title>
                <FormField label={i18n`OID Code Resolution`} tooltip={i18n`Resolution at which OID codes will be generated.`}>
                    <NumberInput mt={.75} {...form.getInputProps("oidCodeResolution")} right="DPI" />
                </FormField>
                <FormField label={i18n`OID Pixel Size`} tooltip={i18n`Number of pixels (squared) for each dot in the OID code.`}>
                    <NumberInput mt={.75} {...form.getInputProps("oidCodePixelSize")} right="px" />
                </FormField>

                <Title my="lg" order={2}>{i18n`Layout Settings`}</Title>
                <FormField label={i18n`Paper Size`}>
                    <Select mt={.75}{...form.getInputProps("paperSize")}
                        data={[i18n`A4`, i18n`A4 landscape`, i18n`letter`]}
                    />
                </FormField>
                <FormField
                    label={i18n`Layout`}
                    tooltip={
                        <dl>
                            <dt>{i18n`Tiles`}</dt>
                            <dd>{i18n`Choose this preset for a tiled layout that includes only minimal album details and general controls that work with all albums.`}</dd>
                            <dt>{i18n`Table`}</dt>
                            <dd>{i18n`Choose this preset for a layout that is optimized for printing CD booklets.`}</dd>
                        </dl>
                    } >
                    <Radio.Group {...form.getInputProps("layout")}>
                        <Group >
                            <Radio value="tiles" label={i18n`Tiles`} />
                            <Radio value="table" label={i18n`Table`} />
                        </Group>
                    </Radio.Group>
                </FormField>
                <FormField label={i18n`Features`} >
                    <Checkbox.Group>
                        <Group>
                            <Checkbox {...form.getInputProps("featureCover", { type: 'checkbox' })} value="cover" label={i18n`Cover`} />
                            <Checkbox {...form.getInputProps("featureAlbumInfo", { type: 'checkbox' })} value="albumInfo" label={i18n`Album Info`} />
                            <Checkbox {...form.getInputProps("featureAlbumControls", { type: 'checkbox' })} value="albumControls" label={i18n`Album Controls`} />
                            <Checkbox {...form.getInputProps("featureTracks", { type: 'checkbox' })} value="tracks" label={i18n`Tracks`} />
                            <Checkbox {...form.getInputProps("featureGeneralControls", { type: 'checkbox' })} value="generalControls" label={i18n`General Control`} />
                        </Group>
                    </Checkbox.Group>
                </FormField>
                {form.values.layout === "tiles" &&
                    <>
                        <FormField label={i18n`Tile Size`} tooltip={i18n`For the tiled layout: size of each tile. Useful if you want to cut out the tiles and put them somewhere like a CD case.`}>
                            <NumberInput mt={.75} {...form.getInputProps("tileSize")} />
                        </FormField>
                    </>
                }

                <Title my="lg" order={2}>{i18n`Print Preview`}</Title>
                <PrintPreview />
            </Container>
        </Drawer >
    )
}