import { z } from "zod";

import { pipeCodecs } from "../../core/pipe-codecs";
import type { Codec } from "../../core/types";
import { emptiableStringAndNullishString } from "./atoms/nullish-string-and-emptiable-string";
import { buildArrayOfCodec } from "./builders/array-of";
import { buildFilteredNullishArrayCodec } from "./builders/filtered-nullish-array";

const nonEmptyStringSchema = z.string().min(1);

const {
	inputSchema,
	outputSchema,
	fromOutput: fromArrayOfNullishStrings,
	fromInput: fromArrayOfNonEmptyStrings,
} = pipeCodecs(
	buildArrayOfCodec(emptiableStringAndNullishString),
	buildFilteredNullishArrayCodec(z.string(), nonEmptyStringSchema),
);

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: (input) => fromArrayOfNonEmptyStrings(input ?? []),
	fromOutput: fromArrayOfNullishStrings,
	inputSchema,
	outputSchema,
} as const satisfies Codec<typeof inputSchema, typeof outputSchema>;
