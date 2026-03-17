import { z } from "zod";
import type { Codec } from "../../../../../core/types";

const isoStringSchema = z.string().date();
const dateSchema = z.date();

export const dateAndIsoString = {
	fromInput: (v) => new Date(v),
	fromOutput: (v) => v.toISOString(),
	inputSchema: isoStringSchema,
	outputSchema: dateSchema,
} as const satisfies Codec<Date, string>;

export const isoStringAndDate = {
	fromInput: (v) => v.toISOString(),
	fromOutput: (v) => new Date(v),
	inputSchema: dateSchema,
	outputSchema: isoStringSchema,
} as const satisfies Codec<string, Date>;
