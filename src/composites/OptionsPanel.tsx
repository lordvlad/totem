import { Button, Drawer, Grid, Input, Page } from '@geist-ui/core'
import { X } from '@geist-ui/icons'

import { CheckboxList } from '../components/CheckboxList.js'
import { FormField, type FormFieldProps } from '../components/FormField.js'
import { RadioGroup } from '../components/RadioGroup.js'
import { useI18n } from '../i18n/i18n.js'
import { initialPrintOptions } from '../library/options.js'
import { useForm } from '../hooks/useForm.js'
import { useGlobalState } from '../hooks/useGlobalState.js'


function OptionsFormField({ children, ...props }: FormFieldProps) {
    return <Grid lg={6} sm={12}><FormField {...props}>{children}</FormField></Grid>
}

export function OptionsPanel() {
    const i18n = useI18n()
    const [showOptionsPanel, setShowOptionsPanel] = useGlobalState("showOptionsPanel", false)

    const {
        layout,
        cols,
        tileSize,
        featureCover,
        featureAlbumInfo,
        featureAlbumControls,
        featureGeneralControls,
        featureTracks,
        oidCodeResolution,
        oidPixelSize,
        paperSize,
    } = useForm(initialPrintOptions, { localStorageKey: 'options' })

    return (
        <Drawer visible={showOptionsPanel} onClose={() => setShowOptionsPanel(false)} placement="top">
            <Drawer.Content>
                <Grid.Container>
                    <Grid xs />
                    <Grid >
                        {/* @ts-expect-error */}
                        <Button onClick={() => setShowOptionsPanel(false)} auto iconRight={<X />}>{i18n`Close`}</Button>
                    </Grid>
                </Grid.Container>
                <Page>
                    <Grid.Container gap={4}>
                        <OptionsFormField
                            label={i18n`Layout`}
                            tooltip={
                                <dl>
                                    <dt>{i18n`List`}</dt>
                                    <dd>{i18n`Choose this preset for a list layout that includes all album details.`}</dd>
                                    <dt>{i18n`Tiles`}</dt>
                                    <dd>{i18n`Choose this preset for a tiled layout that includes only minimal album details and general controls that work with all albums.`}</dd>
                                    <dt>{i18n`CD Booklet`}</dt>
                                    <dd>{i18n`Choose this preset for a layout that is optimized for printing CD booklets.`}</dd>
                                </dl>
                            } >
                            <RadioGroup style={{ marginTop: 1.05 }} input={layout} items={{
                                'list': i18n`List`,
                                'tiles': i18n`Tiles`,
                                'booklet': i18n`CD Booklet`
                            }} />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`Features`} >
                            <CheckboxList style={{ marginTop: 1.5 }} items={{
                                [i18n`Cover`]: featureCover,
                                [i18n`Album Info`]: featureAlbumInfo,
                                [i18n`Album Controls`]: featureAlbumControls,
                                [i18n`Tracks`]: featureTracks,
                                [i18n`General Control`]: featureGeneralControls,
                            }} />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`Columns`} >
                            {/* @ts-expect-error */}
                            <Input mt={.75} {...cols.bindings} htmlType="number" required />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`Tile Size`} tooltip={i18n`For the tiled layout: size of each tile. Useful if you want to cut out the tiles and put them somewhere like a CD case.`}>
                            {/* @ts-expect-error */}
                            <Input mt={.75} {...tileSize.bindings} htmlType="number" />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`OID Code Resolution`} tooltip={i18n`Resolution at which OID codes will be generated.`}>
                            {/* @ts-expect-error */}
                            <Input mt={.75} {...oidCodeResolution.bindings} htmlType="number" labelRight="DPI" />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`OID Pixel Size`} tooltip={i18n`Number of pixels (squared) for each dot in the OID code.`}>
                            {/* @ts-expect-error */}
                            <Input mt={.75} {...oidPixelSize.bindings} htmlType="number" labelRight="px" />
                        </OptionsFormField>
                        <OptionsFormField label={i18n`Paper Size`}>
                            {/* @ts-expect-error */}
                            <Input mt={.75} {...paperSize.bindings} />
                        </OptionsFormField>
                    </Grid.Container>
                </Page>
            </Drawer.Content>
        </Drawer >
    )
}