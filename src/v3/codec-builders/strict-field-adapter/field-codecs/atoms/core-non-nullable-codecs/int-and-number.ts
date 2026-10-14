import { z } from "zod/v3";
import type { Codec } from "../../../../../core/types.js";

// .safe() limits to Number.MIN/MAX_SAFE_INTEGER, so with .int() this is
// Number.isSafeInteger.
const intSchema = z.number().int().safe();
const numberSchema = z.number();

export const intAndNumber = {
	fromInput: (v) => intSchema.parse(v),
	fromOutput: (v) => v,
	inputSchema: numberSchema,
	outputSchema: intSchema,
} as const satisfies Codec<number, number>;
