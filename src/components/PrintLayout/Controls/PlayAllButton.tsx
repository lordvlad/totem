import { useOptions } from "../../../hooks/useOptions";
import { controlIconStyle } from "../../../util/constants";
import { CirclePlay } from "../../icons/CirclePlay";
import { OIDCodeBox } from "../../OIDCode/OIDCodeBox";

export function PlayAllButton() {
  const { playAllOid } = useOptions()[0];
  return (
    <OIDCodeBox code={playAllOid}>
      <CirclePlay {...controlIconStyle} color={"blue"} />
    </OIDCodeBox>
  );
}
