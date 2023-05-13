import { OIDCode, type OIDCodeProps } from "./OIDCode";

export default {
  title: 'Components/OIDCode',
  component: (props: OIDCodeProps) => <div style={{ display: "inline-block", padding: 0, border: 'solid red 1px' }}><OIDCode {...props} /></div>,
};

export const Default: { args: OIDCodeProps } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
  }
}

export const DEBUG: { args: OIDCodeProps } = {
  args: {
    code: 1499,
    width: 256,
    height: 256,
    dpi: 72,
  }
};

