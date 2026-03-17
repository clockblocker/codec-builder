import type { Nullish } from "../../../../core/helpers/nullish-utils";
import type { Codec } from "../../../../core/types";
import { reverseCodecDirections } from "../helpers/reverse-codec-directions";
import { toNullable } from "../helpers/to-nullable";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "../atoms/numeric-string-and-nullish-number";

export { numberAndNumericString, numericStringAndNumber };

export const nullableNumericStringAndNullishNumber =
	toNullable(numericStringAndNumber);

export const numericStringAndNullishNumber =
	nullableNumericStringAndNullishNumber;

export const nullishNumberAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndNullishNumber,
);

export const numberAndNullableNumericString =
	nullishNumberAndNullableNumericString;

export const numberAndNullishNumericString = {
	fromInput: (v) => (v == null ? 0 : Number(v)),
	fromOutput: (v) => String(v),
	inputSchema: numericStringAndNullishNumber.outputSchema
		.unwrap()
		.nullish(),
	outputSchema: numericStringAndNumber.inputSchema,
} as const satisfies Codec<number, Nullish<string>>;
