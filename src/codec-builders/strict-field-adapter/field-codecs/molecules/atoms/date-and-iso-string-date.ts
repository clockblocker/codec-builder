import { z } from "zod";
import type { Nullish } from "../../../../../core/helpers/helper-types";
import { mapNullishToNullable } from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const isoStringSchema = z.string().date();
const dateSchema = z.date();
const nullishIsoStringSchema = isoStringSchema.nullish();
const nullableDateSchema = dateSchema.nullable();

export const dateAndIsoString = {
	fromInput: (v) => new Date(v),
	fromOutput: (v) => v.toISOString(),
	inputSchema: isoStringSchema,
	outputSchema: dateSchema,
} as const satisfies Codec<Date, string>;

export const isoStringAndDate = reverseCodecDirections(dateAndIsoString);

export const nullableDateAndNullishIsoString = {
	fromInput: (v) => mapNullishToNullable(v, (value) => new Date(value)),
	fromOutput: (v) => mapNullishToNullable(v, (value) => value.toISOString()),
	inputSchema: nullishIsoStringSchema,
	outputSchema: nullableDateSchema,
} as const satisfies Codec<Date | null, Nullish<string>>;

export const nullishIsoStringAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoString,
);

export const dateAndNullishIsoString = nullableDateAndNullishIsoString;
export const isoStringAndNullableDate = nullishIsoStringAndNullableDate;

export const dateAndIsoStringDate = dateAndIsoString;
export const isoStringDateAndDate = isoStringAndDate;
