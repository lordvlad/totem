import { useOptions } from "../../../hooks/useOptions";
import { controlIconStyle } from "../../../util/constants";
import { RefreshCCW } from "../../icons/RefreshCCW";
import { OIDCodeBox } from "../../OIDCode/OIDCodeBox";

export function ReplayButton() {
  const { replayOid } = useOptions()[0];
  return (
    <OIDCodeBox code={replayOid}>
      <RefreshCCW {...controlIconStyle} color={"blue"} />
    </OIDCodeBox>
  );
}
