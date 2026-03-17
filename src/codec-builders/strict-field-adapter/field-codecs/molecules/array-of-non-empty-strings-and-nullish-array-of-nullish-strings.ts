import { z } from "zod";
import type { Nullish } from "../../../../core/helpers/nullish-utils";
import { pipeCodecs } from "../../../../core/pipe-codecs";
import type { Codec } from "../../../../core/types";
import { buildArrayOfCodec } from "../builders/array-of";
import { buildFilteredNullishArrayCodec } from "../builders/filtered-nullish-array";
import { emptiableStringAndNullishString } from "./nullish-string-and-emptiable-string";

const nonEmptyStringSchema = z.string().min(1);
const arrayOfEmptiableStrings = buildArrayOfCodec(
	emptiableStringAndNullishString,
);
const nullishArrayOfEmptiableStrings = {
	fromInput: (input: Nullish<Nullish<string>[]>) =>
		arrayOfEmptiableStrings.fromInput(input ?? []),
	fromOutput: arrayOfEmptiableStrings.fromOutput,
	inputSchema: arrayOfEmptiableStrings.inputSchema.nullish(),
	outputSchema: arrayOfEmptiableStrings.outputSchema,
} as const satisfies Codec<string[], Nullish<Nullish<string>[]>>;

const {
	inputSchema,
	outputSchema,
	fromOutput: fromArrayOfNullishStrings,
	fromInput: fromArrayOfNonEmptyStrings,
} = pipeCodecs(
	nullishArrayOfEmptiableStrings,
	buildFilteredNullishArrayCodec(z.string(), nonEmptyStringSchema),
);

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: fromArrayOfNonEmptyStrings,
	fromOutput: fromArrayOfNullishStrings,
	inputSchema,
	outputSchema,
} as const satisfies Codec<string[], Nullish<Nullish<string>[]>>;
