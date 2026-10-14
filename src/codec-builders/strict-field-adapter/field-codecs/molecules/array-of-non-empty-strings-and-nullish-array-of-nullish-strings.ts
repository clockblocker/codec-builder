import { z } from "zod/v4";

const nullishArrayOfNullishStringsSchema = z
	.array(z.string().nullish())
	.nullish();
const arrayOfNonEmptyStringsSchema = z.array(z.string().min(1));

/**
 * Decodes `(string | null | undefined)[] | null | undefined` into `string[]`,
 * dropping `null`, `undefined` and `""` items. A missing array becomes `[]`.
 */
export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = z.codec(
	nullishArrayOfNullishStringsSchema,
	arrayOfNonEmptyStringsSchema,
	{
		decode: (input) =>
			(input ?? []).filter(
				(item): item is string => item != null && item !== "",
			),
		encode: (output) => output,
	},
);
