import { z } from "zod";
import type { Nullish } from "../../../../../core/helpers/helper-types";
import { reverseCodecDirections } from "../../../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const stringSchema = z.string();
const nullishStringSchema = stringSchema.nullish();

export const stringAndNullish = {
	fromInput: (v) => v ?? "",
	fromOutput: (v) => (v === "" ? undefined : v),
	inputSchema: nullishStringSchema,
	outputSchema: stringSchema,
} as const satisfies Codec<string, Nullish<string>>;

export const nullishStringAndString = reverseCodecDirections(
	stringAndNullish,
);

export const emptiableStringAndNullishString = stringAndNullish;
export const nullishStringAndEmptiableString = nullishStringAndString;
