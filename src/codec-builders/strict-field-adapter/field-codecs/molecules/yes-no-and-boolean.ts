import {
	buildNullableOutputAndNullishInputCodec,
} from "../builders/nullable-output-and-nullish-input";
import { reverseCodecDirections } from "../builders/reverse-codec-directions";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./atoms/yes-no-and-boolean";

export { booleanAndYesNo, yesNoAndBoolean };

export const nullableYesNoAndNullishBoolean =
	buildNullableOutputAndNullishInputCodec(yesNoAndBoolean);

export const nullishBooleanAndNullableYesNo = reverseCodecDirections(
	nullableYesNoAndNullishBoolean,
);

export const yesNoAndNullishBoolean = nullableYesNoAndNullishBoolean;
export const booleanAndNullableYesNo = nullishBooleanAndNullableYesNo;
