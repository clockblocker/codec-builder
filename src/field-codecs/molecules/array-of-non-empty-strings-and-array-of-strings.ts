import { z } from "zod";

import type { Nullish } from "../../core/helpers/types";
import type { Codec } from "../../core/types";

const nonEmptyStringSchema = z.string().min(1);
const arrayOfStringsSchema = z.array(z.string());
const arrayOfNonEmptyStringsSchema = z.array(nonEmptyStringSchema);

type ArrayOfStrings = string[];
type ArrayOfNonEmptyStrings = z.infer<typeof arrayOfNonEmptyStringsSchema>;

function arrayOfNonEmptyStringsFromArrayOfStrings(
	v: Nullish<ArrayOfStrings>,
): ArrayOfNonEmptyStrings {
	return (v ?? []).filter((item) => item.length > 0);
}

function arrayOfStringsFromArrayOfNonEmptyStrings(
	v: Nullish<ArrayOfNonEmptyStrings>,
): ArrayOfStrings {
	return [...(v ?? [])];
}

export const arrayOfNonEmptyStringsAndArrayOfStrings = {
	fromInput: arrayOfNonEmptyStringsFromArrayOfStrings,
	fromOutput: arrayOfStringsFromArrayOfNonEmptyStrings,
	inputSchema: arrayOfStringsSchema,
	outputSchema: arrayOfNonEmptyStringsSchema,
} as const satisfies Codec<
	typeof arrayOfStringsSchema,
	typeof arrayOfNonEmptyStringsSchema
>;
