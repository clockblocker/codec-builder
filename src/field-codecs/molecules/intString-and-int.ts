import { z } from "zod";

import type { Codec } from "../../core/types";

const intStringSchema = z.string().regex(/^-?\d+$/);
const nullishIntStringSchema = intStringSchema.nullish();
type NullishIntString = z.infer<typeof nullishIntStringSchema>;

const nullishIntSchema = z.number().int().nullish();
type NullishInt = z.infer<typeof nullishIntSchema>;

export const intStringAndInt = {
	fromInput: (v) => v == null ? undefined : String(v),
	fromOutput: (v) => v == null ? undefined : Number.parseInt(v, 10),
	inputSchema: nullishIntSchema,
	outputSchema: nullishIntStringSchema,
} as const satisfies Codec<
	NullishIntString,
	NullishInt,
	typeof nullishIntSchema,
	typeof nullishIntStringSchema
>;
