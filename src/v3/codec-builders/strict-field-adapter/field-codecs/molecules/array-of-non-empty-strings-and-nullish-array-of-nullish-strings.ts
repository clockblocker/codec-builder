import { z } from "zod/v3";
import type { Nullish } from "../../../../core/helpers/nullish-utils";
import { pipeCodecs } from "../../../../core/pipe-codecs";
import type { Codec, SchemaCodec } from "../../../../core/types";
import { toArrayOf } from "../../helpers/casters/to-array-of";
import { toNonNullishWithDefault } from "../../helpers/casters/to-non-nullish-with-default";
import { toNullable } from "../../helpers/casters/to-nullable";
import { stringAndNullishString } from "../atoms/derived/string";

const nonEmptyStringSchema = z.string().min(1);
const arrayOfNullishStrings = toArrayOf(stringAndNullishString);
const nullishArrayOfStrings = toNonNullishWithDefault(
	toNullable(arrayOfNullishStrings),
	() => [],
);

const nonEmptyStringsInputSchema = z.array(z.string());
const nonEmptyStringsOutputSchema = z.array(nonEmptyStringSchema);
const dropEmptyStrings = {
	fromInput: (input) => input.filter((item) => item !== ""),
	fromOutput: (output) => output,
	inputSchema: nonEmptyStringsInputSchema,
	outputSchema: nonEmptyStringsOutputSchema,
} as const satisfies SchemaCodec<
	typeof nonEmptyStringsInputSchema,
	typeof nonEmptyStringsOutputSchema
>;

const {
	inputSchema,
	outputSchema,
	fromOutput: fromArrayOfNullishStrings,
	fromInput: fromArrayOfNonEmptyStrings,
} = pipeCodecs(nullishArrayOfStrings, dropEmptyStrings);

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: fromArrayOfNonEmptyStrings,
	fromOutput: fromArrayOfNullishStrings,
	inputSchema,
	outputSchema,
} as const satisfies Codec<string[], Nullish<Nullish<string>[]>>;
