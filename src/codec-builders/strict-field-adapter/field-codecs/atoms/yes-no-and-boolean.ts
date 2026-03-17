import { z } from "zod";
import type { Nullish } from "../../../../core/helpers/helper-types";
import { mapNullishToNullable } from "../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../core/types";

const yesNoSchema = z.enum(["Yes", "No"]);
const nullableYesNoSchema = yesNoSchema.nullable();

const nullishBooleanSchema = z.boolean().nullish();

const nullableYesNoAndNullishBoolean = {
	fromInput: (v) => mapNullishToNullable(v, (value) => (value ? "Yes" : "No")),
	fromOutput: (v) => mapNullishToNullable(v, (value) => value === "Yes"),
	inputSchema: nullishBooleanSchema,
	outputSchema: nullableYesNoSchema,
} as const satisfies Codec<Nullish<boolean>, "Yes" | "No" | null>;

const nullishBooleanAndNullableYesNo = reverseCodecDirections(
	nullableYesNoAndNullishBoolean,
);

export const yesNoAndBoolean = nullableYesNoAndNullishBoolean;
export const booleanAndYesNo = nullishBooleanAndNullableYesNo;
