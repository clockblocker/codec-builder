import { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToNullable } from "../../core/helpers/nullish-utils";

const intStringSchema = z.string().regex(/^-?\d+$/);
const nullishIntStringSchema = intStringSchema.nullish();

const nullishIntSchema = z.number().int().nullish();

export const intStringAndNullishInt = {
	fromInput: v => mapNullishToNullable(v, String),
	fromOutput: v => mapNullishToNullable(v, value => Number.parseInt(value, 10)),
	inputSchema: nullishIntSchema,
	outputSchema: nullishIntStringSchema,
} as const satisfies Codec<typeof nullishIntSchema, typeof nullishIntStringSchema>;
