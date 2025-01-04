import { useOptions } from "../../../hooks/useOptions";
import { controlIconStyle } from "../../../util/constants";
import { CircleStop } from "../../icons/CircleStop";
import { OIDCodeBox } from "../../OIDCode/OIDCodeBox";

export function StopButton() {
  const { stopOid } = useOptions()[0];
  return (
    <OIDCodeBox code={stopOid}>
      <CircleStop {...controlIconStyle} color={"red"} />
    </OIDCodeBox>
  );
}
