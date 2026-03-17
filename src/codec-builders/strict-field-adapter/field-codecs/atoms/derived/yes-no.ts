import { reverseCodecDirections } from "../../../helpers/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/to-nullable";
import { yesNoAndBoolean } from "../core-non-nullable-codecs/yes-no-and-boolean";

export { yesNoAndBoolean };

export const booleanAndYesNo = reverseCodecDirections(yesNoAndBoolean);

export const nullableYesNoAndBoolean = toNullable(yesNoAndBoolean);
export const yesNoAndNullishBoolean = toNonNullableWithDefault(
	nullableYesNoAndBoolean,
	"No",
);

export const nullableBooleanAndYesNo = toNullable(booleanAndYesNo);
export const booleanAndNullishYesNo = toNonNullableWithDefault(
	nullableBooleanAndYesNo,
	false,
);
