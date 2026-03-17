import { reverseCodecDirections } from "../../../helpers/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/to-nullable";
import { numericStringAndNumber } from "../core-non-nullable-codecs/numeric-string-and-number";

export { numericStringAndNumber };

export const numberAndNumericString = reverseCodecDirections(
	numericStringAndNumber,
);

export const nullableNumericStringAndNumber = toNullable(
	numericStringAndNumber,
);
export const numericStringAndNullishNumber = toNonNullableWithDefault(
	nullableNumericStringAndNumber,
	"0",
);

export const nullableNumberAndNumericString = toNullable(
	numberAndNumericString,
);
export const numberAndNullishNumericString = toNonNullableWithDefault(
	nullableNumberAndNumericString,
	0,
);
