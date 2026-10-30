import { Schema, SchemaGetter } from "effect";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";

// The ISO forms `z.iso.date()` and `z.iso.datetime({ offset: true })`
// accept, so both entry points take the same strings: a calendar date
// (leap years included), or a date and time with seconds and `Z` or an
// offset. Effect's own `Schema.DateFromString` takes anything `new Date()`
// can parse. Patterns adapted from Zod (MIT).
const isoDateSource =
	"(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
const isoTimeSource =
	"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d))";
const isoDatePattern = new RegExp(`^${isoDateSource}$`);
const isoDateTimePattern = new RegExp(`^${isoDateSource}T${isoTimeSource}$`);

const isoStringSchema = Schema.String.check(
	Schema.makeFilter(
		(v: string) => isoDatePattern.test(v) || isoDateTimePattern.test(v),
		{ message: "Expected an ISO date or datetime" },
	),
);

// `Schema.Date` rejects invalid dates, as `z.date()` does.
export const dateAndIsoString = isoStringSchema.pipe(
	Schema.decodeTo(Schema.Date, {
		decode: SchemaGetter.transform((value) => new Date(value)),
		encode: SchemaGetter.transform((value) => value.toISOString()),
	}),
);

export const isoStringAndDate = Schema.flip(dateAndIsoString);

export const nullableDateAndNullishIsoString = toNullable(dateAndIsoString);

export const dateAndNullishIsoString = toNonNullishWithDefault(
	nullableDateAndNullishIsoString,
	() => new Date(),
);

export const nullableIsoStringAndNullishDate = toNullable(isoStringAndDate);

export const isoStringAndNullishDate = toNonNullishWithDefault(
	nullableIsoStringAndNullishDate,
	() => new Date().toISOString(),
);
