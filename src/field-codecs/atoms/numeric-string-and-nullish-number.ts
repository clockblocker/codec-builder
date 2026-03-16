import { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToNullable } from "../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../core/helpers/reverse-codec-directions";

const numericStringSchema = z
	.string()
	.refine(v => v.trim() !== "" && !Number.isNaN(Number(v)), {
		message: "Expected a numeric string",
	});

const nullishNumericStringSchema = numericStringSchema.nullish();
const nullishNumberSchema = z.number().nullish();

export const numericStringAndNullishNumber = {
	fromInput: v => mapNullishToNullable(v, String),
	fromOutput: v => mapNullishToNullable(v, Number),
	inputSchema: nullishNumberSchema,
	outputSchema: nullishNumericStringSchema,
} as const satisfies Codec<typeof nullishNumberSchema, typeof nullishNumericStringSchema>;

export const nullishNumberAndNumericString =
	reverseCodecDirections(numericStringAndNullishNumber);
