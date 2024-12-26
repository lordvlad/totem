import { OIDCode, type OIDCodeProps } from './OIDCode'

type Arg = OIDCodeProps & { dpi: number, size?: number }

export default {
  title: 'Components/OIDCode',
  component: ({ size, dpi, ...props }: Arg) => {
    return (
      <div style={{ display: 'inline-block', padding: 0, border: 'solid red 1px' }}><OIDCode {...props} dpi={dpi} /></div>
    )
  }
}

export const Default: { args: Arg } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
    dpi: 1200,
    oidCodePixelSize: 3
  }
}

export const DEBUG: { args: Arg } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
    dpi: 72,
    size: 3,
    oidCodePixelSize: 3
  }
}
