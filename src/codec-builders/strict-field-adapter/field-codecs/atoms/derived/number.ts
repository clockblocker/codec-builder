import { reverseCodecDirections } from "../../../helpers/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/to-nullable";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "../core-non-nullable-codecs/numeric-string-and-number";

export { numberAndNumericString, numericStringAndNumber };

export const nullableNumericStringAndNumber = toNullable(numericStringAndNumber);
export const numericStringAndNullishNumber = toNonNullableWithDefault(
	nullableNumericStringAndNumber,
	"0",
);

export const nullableNumberAndNumericString = reverseCodecDirections(
	nullableNumericStringAndNumber,
);
export const numberAndNullishNumericString = toNonNullableWithDefault(
	nullableNumberAndNumericString,
	0,
);
