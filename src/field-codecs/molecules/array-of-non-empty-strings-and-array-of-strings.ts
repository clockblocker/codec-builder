import { z } from "zod";

import { pipeCodecs } from "../../core/pipe-codecs";
import type { Codec } from "../../core/types";
import { nullishStringAndEmptiableString } from "./atoms/nullish-string-and-emptiable-string";
import { buildArrayOfCodec } from "./builders/array-of-codec-builder";

const nonEmptyStringSchema = z.string().min(1);
const arrayOfStringsSchema = z.array(z.string());
const arrayOfNullishStringsSchema = z.array(z.string().nullish());
const arrayOfNonEmptyStringsSchema = z.array(nonEmptyStringSchema);

type ArrayOfNonEmptyStrings = z.infer<typeof arrayOfNonEmptyStringsSchema>;

const arrayOfNullishStringsAndArrayOfStrings = buildArrayOfCodec(
	nullishStringAndEmptiableString,
);

function isDefined<T>(value: T | null | undefined): value is T {
	return value != null;
}

const arrayOfNonEmptyStringsAndArrayOfNullishStrings = {
	fromInput: (input: z.infer<typeof arrayOfNullishStringsSchema>): ArrayOfNonEmptyStrings =>
		input.filter(isDefined),
	fromOutput: (output: ArrayOfNonEmptyStrings): z.infer<typeof arrayOfNullishStringsSchema> =>
		[...output],
	inputSchema: arrayOfNullishStringsSchema,
	outputSchema: arrayOfNonEmptyStringsSchema,
} as const satisfies Codec<
	typeof arrayOfNullishStringsSchema,
	typeof arrayOfNonEmptyStringsSchema
>;

export const arrayOfNonEmptyStringsAndArrayOfStrings = pipeCodecs(
	arrayOfNullishStringsAndArrayOfStrings,
	arrayOfNonEmptyStringsAndArrayOfNullishStrings,
) as Codec<typeof arrayOfStringsSchema, typeof arrayOfNonEmptyStringsSchema>;
