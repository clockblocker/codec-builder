import { z } from "zod";

import type { Codec } from "../../core/types";

const emptiableStringSchema = z.string();
type EmptiableString = z.infer<typeof emptiableStringSchema>;

const nullishStringSchema = z.string().nullish();
type NullishString = z.infer<typeof nullishStringSchema>;

function emptiableStringFromNullishString(v: NullishString): EmptiableString {
	return v ?? "";
}

function nullishStringFromEmptiableString(v: EmptiableString): NullishString {
	return v === "" ? undefined : v;
}

export const emptiableStringAndNullishString = {
	fromInput: emptiableStringFromNullishString,
	fromOutput: nullishStringFromEmptiableString,
	inputSchema: nullishStringSchema,
	outputSchema: emptiableStringSchema,
} as const satisfies Codec<
	EmptiableString,
	NullishString,
	typeof nullishStringSchema,
	typeof emptiableStringSchema
>;

export const nullishStringAndEmptiableString = {
	fromInput: emptiableStringAndNullishString.fromOutput,
	fromOutput: emptiableStringAndNullishString.fromInput,
	inputSchema: emptiableStringSchema,
	outputSchema: nullishStringSchema,
} as const satisfies Codec<
	NullishString,
	EmptiableString,
	typeof emptiableStringSchema,
	typeof nullishStringSchema
>;
