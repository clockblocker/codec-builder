import { pipeCodecs } from "../../../../core/pipe-codecs";
import { reverseCodecDirections } from "../../helpers/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../helpers/to-nullable";
import { numericStringAndNumber } from "../atoms/core-non-nullable-codecs/numeric-string-and-number";
import { numberAndInt } from "../atoms/derived/int";

export const numericStringAndInt = pipeCodecs(
	numberAndInt,
	numericStringAndNumber,
);

export const intAndNumericString = reverseCodecDirections(numericStringAndInt);

export const nullableNumericStringAndInt = toNullable(numericStringAndInt);
export const numericStringAndNullishInt = toNonNullableWithDefault(
	nullableNumericStringAndInt,
	"0",
);

export const nullableIntAndNumericString = toNullable(intAndNumericString);
export const intAndNullishNumericString = toNonNullableWithDefault(
	nullableIntAndNumericString,
	0,
);

export const nullableNumericStringAndNullishInt = nullableNumericStringAndInt;
export const nullishIntAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndNullishInt,
);
