import { z } from "zod/v3";
import type { Codec } from "../../../../../core/types";

// Plain decimal only: optional sign, digits, optional fraction. Rejects
// whitespace, hex/binary/octal prefixes, exponents, "Infinity" and "NaN".
const decimalStringPattern = /^[+-]?\d+(\.\d+)?$/;

const numericStringSchema = z
	.string()
	.refine((v) => decimalStringPattern.test(v), {
		message: "Expected a numeric string",
	});

const numberSchema = z.number();

export const numericStringAndNumber = {
	fromInput: (v) => String(v),
	fromOutput: (v) => Number(numericStringSchema.parse(v)),
	inputSchema: numberSchema,
	outputSchema: numericStringSchema,
} as const satisfies Codec<string, number>;
