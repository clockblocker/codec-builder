import { z } from "zod";
import type { Nullish } from "../../../../../core/helpers/helper-types";
import { mapNullishToNullable } from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const numericStringSchema = z
	.string()
	.refine((v) => v.trim() !== "" && !Number.isNaN(Number(v)), {
		message: "Expected a numeric string",
	});

const numberSchema = z.number();
const nullishNumericStringSchema = numericStringSchema.nullish();
const nullableNumericStringSchema = numericStringSchema.nullable();
const nullishNumberSchema = numberSchema.nullish();

export const numericStringAndNumber = {
	fromInput: (v) => String(v),
	fromOutput: (v) => Number(v),
	inputSchema: numberSchema,
	outputSchema: numericStringSchema,
} as const satisfies Codec<string, number>;

export const numberAndNumericString = reverseCodecDirections(
	numericStringAndNumber,
);

export const numberAndNullishNumericString = {
	fromInput: (v) => (v == null ? 0 : Number(v)),
	fromOutput: (v) => String(v),
	inputSchema: nullishNumericStringSchema,
	outputSchema: numberSchema,
} as const satisfies Codec<number, Nullish<string>>;

export const nullableNumericStringAndNullishNumber = {
	fromInput: (v) => mapNullishToNullable(v, String),
	fromOutput: (v) => mapNullishToNullable(v, Number),
	inputSchema: nullishNumberSchema,
	outputSchema: nullableNumericStringSchema,
} as const satisfies Codec<string | null, Nullish<number>>;

export const numericStringAndNullishNumber =
	nullableNumericStringAndNullishNumber;

export const nullishNumberAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndNullishNumber,
);

export const numberAndNullableNumericString =
	nullishNumberAndNullableNumericString;
