import { z } from "zod";
import { mapNullishToNullable } from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const isoStringDateSchema = z.string().date();

const nullishIsoStringDateSchema = isoStringDateSchema.nullish();
const nullableDateSchema = z.date().nullable();

const nullableDateAndNullishIsoStringDate = {
	fromInput: (v) => mapNullishToNullable(v, (value) => new Date(value)),
	fromOutput: (v) =>
		mapNullishToNullable(v, (value) => value.toISOString().slice(0, 10)),
	inputSchema: nullishIsoStringDateSchema,
	outputSchema: nullableDateSchema,
} as const satisfies Codec<
	typeof nullishIsoStringDateSchema,
	typeof nullableDateSchema
>;

const nullishIsoStringDateAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoStringDate,
);

export const dateAndIsoStringDate = nullableDateAndNullishIsoStringDate;
export const isoStringDateAndDate = nullishIsoStringDateAndNullableDate;
