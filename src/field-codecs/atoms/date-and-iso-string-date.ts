import { z } from "zod";

import type { Codec } from "../../core/types";

const isoStringDateSchema = z.string().date();

const nullishIsoStringDateSchema = isoStringDateSchema.nullish();
const nullishDateSchema = z.date().nullish();

export const dateAndIsoStringDate = {
	fromInput: v => {
		if (typeof v !== "string") return undefined;
		if (Number.isNaN(Date.parse(v))) return undefined;
		return new Date(v);
	},
	fromOutput: v => v == null ? undefined : v.toISOString().slice(0, 10),
	inputSchema: nullishIsoStringDateSchema,
	outputSchema: nullishDateSchema,
} as const satisfies Codec<typeof nullishIsoStringDateSchema, typeof nullishDateSchema>;

export const isoStringDateAndDate = {
	fromInput: dateAndIsoStringDate.fromOutput,
	fromOutput: dateAndIsoStringDate.fromInput,
	inputSchema: nullishDateSchema,
	outputSchema: nullishIsoStringDateSchema,
} as const satisfies Codec<typeof nullishDateSchema, typeof nullishIsoStringDateSchema>;
