import { z } from "zod";
import type { Nullish } from "../../../../../core/helpers/helper-types";
import { mapNullishToNullable } from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const isoStringDateSchema = z.string().date();

const nullishIsoStringDateSchema = isoStringDateSchema.nullish();
const nullableDateSchema = z.date().nullable();

export const nullableDateAndNullishIsoString = {
	fromInput: (v) => mapNullishToNullable(v, (value) => new Date(value)),
	fromOutput: (v) => mapNullishToNullable(v, (value) => value.toISOString()),
	inputSchema: nullishIsoStringDateSchema,
	outputSchema: nullableDateSchema,
} as const satisfies Codec<Date | null, Nullish<string>>;

export const nullishIsoStringAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoString,
);

export const dateAndIsoStringDate = nullableDateAndNullishIsoString;
export const isoStringDateAndDate = nullishIsoStringAndNullableDate;
