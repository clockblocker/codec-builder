import { z } from "zod";
import { mapNullishToNullable } from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const numericStringSchema = z
	.string()
	.refine((v) => v.trim() !== "" && !Number.isNaN(Number(v)), {
		message: "Expected a numeric string",
	});

const nullableNumericStringSchema = numericStringSchema.nullable();
const nullishNumberSchema = z.number().nullish();

const nullableNumericStringAndNullishNumber = {
	fromInput: (v) => mapNullishToNullable(v, String),
	fromOutput: (v) => mapNullishToNullable(v, Number),
	inputSchema: nullishNumberSchema,
	outputSchema: nullableNumericStringSchema,
} as const satisfies Codec<
	typeof nullishNumberSchema,
	typeof nullableNumericStringSchema
>;

export const numericStringAndNullishNumber =
	nullableNumericStringAndNullishNumber;

export const numberAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndNullishNumber,
);
