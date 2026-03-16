import { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToNullable } from "../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../core/helpers/reverse-codec-directions";

const yesNoSchema = z.enum(["Yes", "No"]);
const nullishYesNoSchema = yesNoSchema.nullish();

const nullishBooleanSchema = z.boolean().nullish();

export const yesNoAndBoolean = {
	fromInput: v => mapNullishToNullable(v, value => value ? "Yes" : "No"),
	fromOutput: v => mapNullishToNullable(v, value => value === "Yes"),
	inputSchema: nullishBooleanSchema,
	outputSchema: nullishYesNoSchema,
} as const satisfies Codec<typeof nullishBooleanSchema, typeof nullishYesNoSchema>;

export const booleanAndYesNo = reverseCodecDirections(yesNoAndBoolean);
