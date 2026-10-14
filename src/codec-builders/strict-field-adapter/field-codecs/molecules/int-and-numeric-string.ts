import { z } from "zod/v4";
import { toNonNullishWithDefault } from "../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../helpers/casters/to-nullable.js";
import { integerNumericStringSchema } from "../atoms/core-non-nullable-codecs/numeric-string-and-number.js";

// Non-integer numeric strings ("1.9") are rejected, not floored. Both sides
// are limited to safe integers: z.number().int() enforces the safe range in
// Zod 4, and the string side checks Number.isSafeInteger.
export const numericStringAndInt = z.codec(
	z.number().int(),
	integerNumericStringSchema,
	{
		decode: String,
		encode: Number,
	},
);

export const intAndNumericString = z.invertCodec(numericStringAndInt);

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

export const nullishIntAndNullableNumericString = z.invertCodec(
	nullableNumericStringAndInt,
);
