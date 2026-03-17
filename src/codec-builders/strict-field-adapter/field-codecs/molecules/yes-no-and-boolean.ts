import { reverseCodecDirections } from "../helpers/reverse-codec-directions";
import { toNullableOutputAndNullishInput } from "../helpers/to-nullable-output-and-nullish-input";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./atoms/yes-no-and-boolean";

export { booleanAndYesNo, yesNoAndBoolean };

export const nullableYesNoAndNullishBoolean =
	toNullableOutputAndNullishInput(yesNoAndBoolean);

export const nullishBooleanAndNullableYesNo = reverseCodecDirections(
	nullableYesNoAndNullishBoolean,
);

export const yesNoAndNullishBoolean = nullableYesNoAndNullishBoolean;
export const booleanAndNullableYesNo = nullishBooleanAndNullableYesNo;
