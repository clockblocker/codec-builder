import { z } from "zod/v4";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default";
import { toNullable } from "../../../helpers/casters/to-nullable";

const isoDateSchema = z.iso.date();
const isoDateTimeSchema = z.iso.datetime({ offset: true });
const isoStringSchema = z.union([isoDateSchema, isoDateTimeSchema]);
const dateSchema = z.date();

const nullableDateInputSchema = isoStringSchema.nullish();
const nullableDateOutputSchema = dateSchema.nullable();

export const nullableDateAndNullishIsoString = z.codec(
	nullableDateInputSchema,
	nullableDateOutputSchema,
	{
		decode: (value) => (value == null ? null : new Date(value)),
		encode: (value) => (value == null ? null : value.toISOString()),
	},
);

export const isoStringAndDate = z.codec(dateSchema, isoStringSchema, {
	decode: (value) => value.toISOString(),
	encode: (value) => new Date(value),
});

export const dateAndNullishIsoString = toNonNullishWithDefault(
	nullableDateAndNullishIsoString,
	() => new Date(),
);

export const nullableIsoStringAndNullishDate = toNullable(isoStringAndDate);

export const isoStringAndNullishDate = toNonNullishWithDefault(
	nullableIsoStringAndNullishDate,
	() => new Date().toISOString(),
);
