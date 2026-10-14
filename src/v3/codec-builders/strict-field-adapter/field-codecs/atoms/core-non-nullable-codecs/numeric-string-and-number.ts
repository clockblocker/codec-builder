import { z } from "zod/v3";
import type { Codec } from "../../../../../core/types.js";

// Decimal with optional sign, fraction and exponent. Accepts everything
// String(number) produces for finite numbers ("1e+21", "1e-7"), so encoded
// values always pass. Rejects whitespace, hex/binary/octal prefixes,
// "Infinity", "NaN", and values that overflow to Infinity ("1e400").
const decimalStringPattern = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

const numericStringSchema = z
	.string()
	.refine((v) => decimalStringPattern.test(v) && Number.isFinite(Number(v)), {
		message: "Expected a numeric string",
	});

const numberSchema = z.number();

export const numericStringAndNumber = {
	fromInput: (v) => String(v),
	fromOutput: (v) => Number(numericStringSchema.parse(v)),
	inputSchema: numberSchema,
	outputSchema: numericStringSchema,
} as const satisfies Codec<string, number>;
