import { z } from "zod";
import {
	mapNullishToNullable,
	type Nullish,
} from "../../../../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../builders/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const yesNoSchema = z.enum(["Yes", "No"]);
const booleanSchema = z.boolean();
const nullableYesNoSchema = yesNoSchema.nullable();
const nullishBooleanSchema = booleanSchema.nullish();

export const yesNoAndBoolean = {
	fromInput: (v) => (v ? "Yes" : "No"),
	fromOutput: (v) => v === "Yes",
	inputSchema: booleanSchema,
	outputSchema: yesNoSchema,
} as const satisfies Codec<"Yes" | "No", boolean>;

export const booleanAndYesNo = reverseCodecDirections(yesNoAndBoolean);

export const nullableYesNoAndNullishBoolean = {
	fromInput: (v) => mapNullishToNullable(v, (value) => (value ? "Yes" : "No")),
	fromOutput: (v) => mapNullishToNullable(v, (value) => value === "Yes"),
	inputSchema: nullishBooleanSchema,
	outputSchema: nullableYesNoSchema,
} as const satisfies Codec<"Yes" | "No" | null, Nullish<boolean>>;

export const nullishBooleanAndNullableYesNo = reverseCodecDirections(
	nullableYesNoAndNullishBoolean,
);

export const yesNoAndNullishBoolean = nullableYesNoAndNullishBoolean;
export const booleanAndNullableYesNo = nullishBooleanAndNullableYesNo;
