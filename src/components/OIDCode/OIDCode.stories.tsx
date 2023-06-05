import { useState } from "preact/hooks";
import { OptionsContext, initialPrintOptions } from "../../library/options";
import { OIDCode, type OIDCodeProps } from "./OIDCode";

type Arg = OIDCodeProps & { dpi?: number, size?: number }

export default {
  title: 'Components/OIDCode',
  component: ({ size, dpi, ...props }: Arg) => {
    const value = useState({
      ...initialPrintOptions,
      oidCodeResolution: dpi ?? initialPrintOptions.oidCodeResolution,
      oidPixelSize: size ?? initialPrintOptions.oidPixelSize,
    })

    return (
      <OptionsContext.Provider value={value}>
        <div style={{ display: "inline-block", padding: 0, border: 'solid red 1px' }}><OIDCode {...props} /></div>
      </OptionsContext.Provider>
    )
  }
};

export const Default: { args: Arg } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
  }
}

export const DEBUG: { args: Arg } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
    dpi: 72,
    size: 3,
  }
};

