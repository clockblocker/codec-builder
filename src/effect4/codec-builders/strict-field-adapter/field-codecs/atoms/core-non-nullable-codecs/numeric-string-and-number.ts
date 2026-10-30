import { Schema, SchemaGetter } from "effect";

// Same grammar as the Zod codecs. Effect's own `Schema.NumberFromString` is
// looser (it reads "" as 0 and trims " 12 "), so it is not used here.

// Decimal numbers with an optional exponent: "12", "-3.5", ".5", "5.", "1e3",
// "1e+21", "1e-7". No whitespace, no hex/binary/octal, no "Infinity"/"NaN".
// The exponent form is accepted because String(number) produces it (for
// example String(1e21) === "1e+21"), so every encoded value parses back.
const numericStringPattern = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export const numericStringSchema = Schema.String.check(
	Schema.makeFilter(
		(v: string) =>
			numericStringPattern.test(v) && Number.isFinite(Number(v)),
		{ message: "Expected a numeric string" },
	),
);

// Integers are digits only, with an optional sign: "42", "-7", "+3". No
// exponent or decimal point ("1e3", "1.0"), even when the value is whole.
// A safe integer never stringifies to exponent form, so whatever `encode`
// produces still decodes back.
const integerNumericStringPattern = /^[+-]?\d+$/;

export const integerNumericStringSchema = Schema.String.check(
	Schema.makeFilter(
		(v: string) =>
			integerNumericStringPattern.test(v) &&
			Number.isSafeInteger(Number(v)),
		{ message: "Expected an integer numeric string" },
	),
);

// `Schema.Finite` rejects NaN and ±Infinity, as `z.number()` does.
export const numberAndNumericString = numericStringSchema.pipe(
	Schema.decodeTo(Schema.Finite, {
		decode: SchemaGetter.transform(Number),
		encode: SchemaGetter.transform(String),
	}),
);

export const numericStringAndNumber = Schema.flip(numberAndNumericString);
