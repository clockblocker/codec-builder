import { z } from "zod";

import type { Codec } from "../../core/types";

const numericStringSchema = z
	.string()
	.refine(v => v.trim() !== "" && !Number.isNaN(Number(v)), {
		message: "Expected a numeric string",
	});

const nullishNumericStringSchema = numericStringSchema.nullish();
const nullishNumberSchema = z.number().nullish();

export const numericStringAndNullishNumber = {
	fromInput: v => v == null ? undefined : String(v),
	fromOutput: v => v == null ? undefined : Number(v),
	inputSchema: nullishNumberSchema,
	outputSchema: nullishNumericStringSchema,
} as const satisfies Codec<typeof nullishNumberSchema, typeof nullishNumericStringSchema>;

export const nullishNumberAndNumericString = {
	fromInput: numericStringAndNullishNumber.fromOutput,
	fromOutput: numericStringAndNullishNumber.fromInput,
	inputSchema: nullishNumericStringSchema,
	outputSchema: nullishNumberSchema,
} as const satisfies Codec<typeof nullishNumericStringSchema, typeof nullishNumberSchema>;
