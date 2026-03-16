import { z } from "zod";

import type { Codec } from "../../core/types";

const yesNoSchema = z.enum(["Yes", "No"]);
const nullishYesNoSchema = yesNoSchema.nullish();

const nullishBooleanSchema = z.boolean().nullish();

export const yesNoAndBoolean = {
	fromInput: v => v == null ? undefined : v ? "Yes" : "No",
	fromOutput: v => v == null ? undefined : v === "Yes",
	inputSchema: nullishBooleanSchema,
	outputSchema: nullishYesNoSchema,
} as const satisfies Codec<typeof nullishBooleanSchema, typeof nullishYesNoSchema>;

export const booleanAndYesNo = {
	fromInput: yesNoAndBoolean.fromOutput,
	fromOutput: yesNoAndBoolean.fromInput,
	inputSchema: nullishYesNoSchema,
	outputSchema: nullishBooleanSchema,
} as const satisfies Codec<typeof nullishYesNoSchema, typeof nullishBooleanSchema>;
