import { z } from "zod/v3";
import { pipeCodecs } from "../../../../core/pipe-codecs.js";
import type { SchemaCodec } from "../../../../core/types.js";
import { reverseCodecDirections } from "../../helpers/casters/reverse-codec-directions.js";
import { toNonNullishWithDefault } from "../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../helpers/casters/to-nullable.js";
import { numericStringAndNumber } from "../atoms/core-non-nullable-codecs/numeric-string-and-number.js";
import { numberAndInt } from "../atoms/derived/int.js";

// Digits only, and within Number.isSafeInteger so the value survives the
// round trip (larger integers lose precision or encode in exponent form).
const integerStringPattern = /^[+-]?\d+$/;
const integerStringSchema = z
	.string()
	.refine(
		(v) => integerStringPattern.test(v) && Number.isSafeInteger(Number(v)),
		{ message: "Expected a safe integer string" },
	);

const pipedNumericStringAndInt = pipeCodecs(
	numberAndInt,
	numericStringAndNumber,
);

export const numericStringAndInt = {
	...pipedNumericStringAndInt,
	fromOutput: (v: string) => Number(integerStringSchema.parse(v)),
	outputSchema: integerStringSchema,
} as const satisfies SchemaCodec<
	typeof pipedNumericStringAndInt.inputSchema,
	typeof integerStringSchema
>;

export const intAndNumericString = reverseCodecDirections(numericStringAndInt);

export const nullableNumericStringAndInt = toNullable(numericStringAndInt);
export const numericStringAndNullishInt = toNonNullishWithDefault(
	nullableNumericStringAndInt,
	"0",
);

export const nullableIntAndNumericString = toNullable(intAndNumericString);
export const intAndNullishNumericString = toNonNullishWithDefault(
	nullableIntAndNumericString,
	0,
);

export const nullishIntAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndInt,
);
