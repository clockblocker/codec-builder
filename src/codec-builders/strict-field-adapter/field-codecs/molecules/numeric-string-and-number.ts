import type { Nullish } from "../../../../core/helpers/nullish-utils";
import type { Codec } from "../../../../core/types";
import {
	buildNullableOutputAndNullishInputCodec,
} from "../builders/nullable-output-and-nullish-input";
import { reverseCodecDirections } from "../builders/reverse-codec-directions";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "./atoms/numeric-string-and-nullish-number";

export { numberAndNumericString, numericStringAndNumber };

export const nullableNumericStringAndNullishNumber =
	buildNullableOutputAndNullishInputCodec(numericStringAndNumber);

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
