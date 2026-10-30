import { Schema, SchemaGetter } from "effect";
import { toNonNullishWithDefault } from "../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../helpers/casters/to-nullable.js";
import { integerNumericStringSchema } from "../atoms/core-non-nullable-codecs/numeric-string-and-number.js";

// Non-integer numeric strings ("1.9") are rejected, not floored. Both sides
// are limited to safe integers: `Schema.Int` checks Number.isSafeInteger,
// and so does the string side.
export const intAndNumericString = integerNumericStringSchema.pipe(
	Schema.decodeTo(Schema.Int, {
		decode: SchemaGetter.transform(Number),
		encode: SchemaGetter.transform(String),
	}),
);

export const numericStringAndInt = Schema.flip(intAndNumericString);

export const nullableNumericStringAndInt = toNullable(numericStringAndInt);
export const numericStringAndNullishInt = toNonNullishWithDefault(
	nullableNumericStringAndInt,
	"0",
);

export const nullableIntAndNumericString = toNullable(intAndNumericString);
export const intAndNullishNumericString = toNonNullishWithDefault(
	nullableIntAndNumericString,
	0,
);
