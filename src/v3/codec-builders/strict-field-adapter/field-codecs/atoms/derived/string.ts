import { z } from "zod/v3";
import type { Nullish } from "../../../../../core/helpers/nullish-utils.js";
import type { Codec } from "../../../../../core/types.js";
import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions.js";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";

const stringSchema = z.string();
const nullishStringSchema = stringSchema.nullish();

export const stringAndNullish = {
	fromInput: (v) => v ?? "",
	fromOutput: (v) => v,
	inputSchema: nullishStringSchema,
	outputSchema: stringSchema,
} as const satisfies Codec<string, Nullish<string>>;

export const nullishStringAndString = reverseCodecDirections(stringAndNullish);

export const nullableStringAndString = toNullable(stringAndNullish);
export const stringAndNullishString = toNonNullishWithDefault(
	nullableStringAndString,
	"",
);
