import { z } from "zod";

import type { Codec } from "../../../types";

const yesNoSchema = z.enum(["Yes", "No"]);
const nullishYesNoSchema = yesNoSchema.nullish();
type NullishYesNo = z.infer<typeof nullishYesNoSchema>;

const nullishBooleanSchema = z.boolean().nullish();
type NullishBoolean = z.infer<typeof nullishBooleanSchema>;

function yesNoFromBoolean(v: boolean): "Yes" | "No";
function yesNoFromBoolean(v: NullishBoolean): NullishYesNo;
function yesNoFromBoolean(v: NullishBoolean): NullishYesNo {
	return v == null ? undefined : v ? "Yes" : "No";
}

function booleanFromYesNo(v: "Yes" | "No"): boolean;
function booleanFromYesNo(v: NullishYesNo): NullishBoolean;
function booleanFromYesNo(v: NullishYesNo): NullishBoolean {
	return v == null ? undefined : v === "Yes";
}

export const yesNoAndBoolean = {
	fromInput: yesNoFromBoolean,
	fromOutput: booleanFromYesNo,
	outputSchema: nullishYesNoSchema,
} as const satisfies Codec<NullishYesNo, NullishBoolean, typeof nullishYesNoSchema>;
