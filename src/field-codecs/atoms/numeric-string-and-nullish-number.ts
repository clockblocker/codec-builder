import { z } from "zod";

import type { Codec } from "../../core/types";

const numericStringSchema = z
	.string()
	.refine((v) => v.trim() !== "" && !Number.isNaN(Number(v)), {
		message: "Expected a numeric string",
	});
const nullishNumericStringSchema = numericStringSchema.nullish();
type NullishNumericString = z.infer<typeof nullishNumericStringSchema>;

const nullishNumberSchema = z.number().nullish();
type NullishNumber = z.infer<typeof nullishNumberSchema>;

function numericStringFromNullishNumber(v: number): string;
function numericStringFromNullishNumber(v: NullishNumber): NullishNumericString;
function numericStringFromNullishNumber(v: NullishNumber): NullishNumericString {
	return v == null ? undefined : String(v);
}

function nullishNumberFromNumericString(v: string): number;
function nullishNumberFromNumericString(v: NullishNumericString): NullishNumber;
function nullishNumberFromNumericString(v: NullishNumericString): NullishNumber {
	return v == null ? undefined : Number(v);
}

export const numericStringAndNullishNumber = {
	fromInput: numericStringFromNullishNumber,
	fromOutput: nullishNumberFromNumericString,
	inputSchema: nullishNumberSchema,
	outputSchema: nullishNumericStringSchema,
} as const satisfies Codec<
	typeof nullishNumberSchema,
	typeof nullishNumericStringSchema
>;

export const nullishNumberAndNumericString = {
	fromInput: numericStringAndNullishNumber.fromOutput,
	fromOutput: numericStringAndNullishNumber.fromInput,
	inputSchema: nullishNumericStringSchema,
	outputSchema: nullishNumberSchema,
} as const satisfies Codec<
	typeof nullishNumericStringSchema,
	typeof nullishNumberSchema
>;
