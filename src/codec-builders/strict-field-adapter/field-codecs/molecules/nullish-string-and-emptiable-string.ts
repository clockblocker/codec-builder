import { z } from "zod";
import type { Nullish } from "../../../../core/helpers/nullish-utils";
import type { Codec } from "../../../../core/types";
import { reverseCodecDirections } from "../builders/reverse-codec-directions";

const stringSchema = z.string();
const nullishStringSchema = stringSchema.nullish();

export const stringAndNullish = {
	fromInput: (v) => v ?? "",
	fromOutput: (v) => (v === "" ? undefined : v),
	inputSchema: nullishStringSchema,
	outputSchema: stringSchema,
} as const satisfies Codec<string, Nullish<string>>;

export const nullishStringAndString = reverseCodecDirections(stringAndNullish);

export const emptiableStringAndNullishString = stringAndNullish;
export const nullishStringAndEmptiableString = nullishStringAndString;
