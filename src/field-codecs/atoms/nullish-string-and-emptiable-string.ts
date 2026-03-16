import { z } from "zod";

import type { Codec } from "../../core/types";

const emptiableStringSchema = z.string();

const nullishStringSchema = z.string().nullish();

export const emptiableStringAndNullishString = {
	fromInput: v => v ?? "",
	fromOutput: v => v === "" ? undefined : v,
	inputSchema: nullishStringSchema,
	outputSchema: emptiableStringSchema,
} as const satisfies Codec<typeof nullishStringSchema, typeof emptiableStringSchema>;

export const nullishStringAndEmptiableString = {
	fromInput: emptiableStringAndNullishString.fromOutput,
	fromOutput: emptiableStringAndNullishString.fromInput,
	inputSchema: emptiableStringSchema,
	outputSchema: nullishStringSchema,
} as const satisfies Codec<typeof emptiableStringSchema, typeof nullishStringSchema>;
