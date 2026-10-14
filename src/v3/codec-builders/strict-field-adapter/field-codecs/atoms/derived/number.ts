import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions.js";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";
import { numericStringAndNumber } from "../core-non-nullable-codecs/numeric-string-and-number.js";

export { numericStringAndNumber };

export const numberAndNumericString = reverseCodecDirections(
	numericStringAndNumber,
);

export const nullableNumericStringAndNumber = toNullable(
	numericStringAndNumber,
);
export const numericStringAndNullishNumber = toNonNullishWithDefault(
	nullableNumericStringAndNumber,
	"0",
);

export const nullableNumberAndNumericString = toNullable(
	numberAndNumericString,
);
export const numberAndNullishNumericString = toNonNullishWithDefault(
	nullableNumberAndNumericString,
	0,
);
