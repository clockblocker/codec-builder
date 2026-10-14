import { z } from "zod/v3";
import { pipeCodecs } from "../../../../core/pipe-codecs";
import type { SchemaCodec } from "../../../../core/types";
import { reverseCodecDirections } from "../../helpers/casters/reverse-codec-directions";
import { toNonNullishWithDefault } from "../../helpers/casters/to-non-nullish-with-default";
import { toNullable } from "../../helpers/casters/to-nullable";
import { numericStringAndNumber } from "../atoms/core-non-nullable-codecs/numeric-string-and-number";
import { numberAndInt } from "../atoms/derived/int";

const integerStringPattern = /^[+-]?\d+$/;
const integerStringSchema = z
	.string()
	.refine((v) => integerStringPattern.test(v), {
		message: "Expected an integer string",
	});

const pipedNumericStringAndInt = pipeCodecs(
	numberAndInt,
	numericStringAndNumber,
);

export const numericStringAndInt = {
	...pipedNumericStringAndInt,
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
