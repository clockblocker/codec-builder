import { z } from "zod";
import type { Nullish } from "../../../../../core/helpers/helper-types";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const emptiableStringSchema = z.string();

const nullishStringSchema = z.string().nullish();

export const emptiableStringAndNullishString = {
	fromInput: (v) => v ?? "",
	fromOutput: (v) => (v === "" ? undefined : v),
	inputSchema: nullishStringSchema,
	outputSchema: emptiableStringSchema,
} as const satisfies Codec<string, Nullish<string>>;

export const nullishStringAndEmptiableString = reverseCodecDirections(
	emptiableStringAndNullishString,
);
