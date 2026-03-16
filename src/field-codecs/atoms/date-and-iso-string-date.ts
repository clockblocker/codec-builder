import { z } from "zod";

import type { Codec } from "../../core/types";

const isoStringDateSchema = z.string().date();
type IsoStringDate = z.infer<typeof isoStringDateSchema>;

const nullishIsoStringDateSchema = isoStringDateSchema.nullish();
type NullishIsoStringDate = z.infer<typeof nullishIsoStringDateSchema>;

const nullishDateSchema = z.date().nullish();
type NullishDate = z.infer<typeof nullishDateSchema>;

function dateFromIsoStringDate(v: IsoStringDate): Date;
function dateFromIsoStringDate(v: NullishIsoStringDate): NullishDate;
function dateFromIsoStringDate(v: NullishIsoStringDate): NullishDate {
	if (typeof v !== "string") return undefined;
	if (Number.isNaN(Date.parse(v))) return undefined;
	return new Date(v);
}

function isoStringDateFromDate(v: Date): IsoStringDate;
function isoStringDateFromDate(v: NullishDate): NullishIsoStringDate;
function isoStringDateFromDate(v: NullishDate): NullishIsoStringDate {
	return v ? v.toISOString().slice(0, 10) : v;
}

export const dateAndIsoStringDate = {
	fromInput: dateFromIsoStringDate,
	fromOutput: isoStringDateFromDate,
	outputSchema: nullishDateSchema,
} as const satisfies Codec<NullishDate, NullishIsoStringDate, typeof nullishDateSchema>;

export const isoStringDateAndDate = {
	fromInput: dateAndIsoStringDate.fromOutput,
	fromOutput: dateAndIsoStringDate.fromInput,
	outputSchema: nullishIsoStringDateSchema,
} as const satisfies Codec<
	NullishIsoStringDate,
	NullishDate,
	typeof nullishIsoStringDateSchema
>;
