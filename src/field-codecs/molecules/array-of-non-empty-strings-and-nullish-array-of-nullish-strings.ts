import { z } from "zod";

import { reverseCodecDirections } from "../../core/helpers/reverse-codec-directions";
import { pipeCodecs } from "../../core/pipe-codecs";
import type { Codec } from "../../core/types";
import { emptiableStringAndNullishString } from "./atoms/nullish-string-and-emptiable-string";
import { buildArrayOfCodec } from "./builders/array-of";
import { buildFilteredNullishArrayCodec } from "./builders/filtered-nullish-array";

const nonEmptyStringSchema = z.string().min(1);

const arrayOfNonEmptyStringsAndArrayOfNullishStrings = pipeCodecs(
	buildArrayOfCodec(emptiableStringAndNullishString),
	buildFilteredNullishArrayCodec(z.string(), nonEmptyStringSchema),
);

const inputSchema = arrayOfNonEmptyStringsAndArrayOfNullishStrings.inputSchema.nullish();

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: input =>
		arrayOfNonEmptyStringsAndArrayOfNullishStrings.fromInput(input ?? []),
	fromOutput: arrayOfNonEmptyStringsAndArrayOfNullishStrings.fromOutput,
	inputSchema,
	outputSchema: arrayOfNonEmptyStringsAndArrayOfNullishStrings.outputSchema,
} as const satisfies Codec<
	typeof inputSchema,
	typeof arrayOfNonEmptyStringsAndArrayOfNullishStrings.outputSchema
>;

export const nullishArrayOfNullishStringsAndArrayOfNonEmptyStrings =
	reverseCodecDirections(
		arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings,
	);
