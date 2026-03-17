import { reverseCodecDirections } from "../../helpers/reverse-codec-directions";
import { toNullable } from "../../helpers/to-nullable";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "../atoms/yes-no-and-boolean";

export { booleanAndYesNo, yesNoAndBoolean };

export const nullableYesNoAndNullishBoolean =
	toNullable(yesNoAndBoolean);

export const nullishBooleanAndNullableYesNo = reverseCodecDirections(
	nullableYesNoAndNullishBoolean,
);

export const yesNoAndNullishBoolean = nullableYesNoAndNullishBoolean;
export const booleanAndNullableYesNo = nullishBooleanAndNullableYesNo;
