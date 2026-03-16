import { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToUndefined } from "../../core/helpers/nullish-utils";

const intStringSchema = z.string().regex(/^-?\d+$/);
const nullishIntStringSchema = intStringSchema.nullish();

const nullishIntSchema = z.number().int().nullish();

export const intStringAndInt = {
	fromInput: v => mapNullishToUndefined(v, String),
	fromOutput: v => mapNullishToUndefined(v, value => Number.parseInt(value, 10)),
	inputSchema: nullishIntSchema,
	outputSchema: nullishIntStringSchema,
} as const satisfies Codec<typeof nullishIntSchema, typeof nullishIntStringSchema>;
