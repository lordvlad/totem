import { useOptions } from "../../../hooks/useOptions";
import { controlIconStyle } from "../../../util/constants";
import { CirclePower } from "../../icons/CirclePower";
import { OIDCodeBox } from "../../OIDCode/OIDCodeBox";

export function PowerButton() {
  const { productId } = useOptions()[0];
  return (
    <OIDCodeBox code={productId}>
      <CirclePower {...controlIconStyle} color={"green"} />
    </OIDCodeBox>
  );
}
