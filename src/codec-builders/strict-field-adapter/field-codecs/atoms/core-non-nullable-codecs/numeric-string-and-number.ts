import { z } from "zod/v4";

// Decimal numbers with an optional exponent: "12", "-3.5", ".5", "5.", "1e3",
// "1e+21", "1e-7". No whitespace, no hex/binary/octal, no "Infinity"/"NaN".
// The exponent form is accepted because String(number) produces it (for
// example String(1e21) === "1e+21"), so every encoded value parses back.
const numericStringPattern = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export const numericStringSchema = z
	.string()
	.refine((v) => numericStringPattern.test(v) && Number.isFinite(Number(v)), {
		message: "Expected a numeric string",
	});

export const integerNumericStringSchema = numericStringSchema.refine(
	(v) => Number.isSafeInteger(Number(v)),
	{ message: "Expected an integer numeric string" },
);

const numberSchema = z.number();

export const numericStringAndNumber = z.codec(
	numberSchema,
	numericStringSchema,
	{
		decode: String,
		encode: Number,
	},
);
