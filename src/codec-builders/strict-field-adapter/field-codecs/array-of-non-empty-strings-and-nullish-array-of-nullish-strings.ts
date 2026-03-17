import { z } from "zod";

import type { Nullish } from "../../../core/helpers/helper-types";
import { pipeCodecs } from "../../../core/pipe-codecs";
import type { Codec } from "../../../core/types";
import { emptiableStringAndNullishString } from "./atoms/nullish-string-and-emptiable-string";
import { buildArrayAndNullishArrayCodec } from "./builders/array-and-nullish-array";
import { buildFilteredNullishArrayCodec } from "./builders/filtered-nullish-array";

const nonEmptyStringSchema = z.string().min(1);

const {
	inputSchema,
	outputSchema,
	fromOutput: fromArrayOfNullishStrings,
	fromInput: fromArrayOfNonEmptyStrings,
} = pipeCodecs(
	buildArrayAndNullishArrayCodec(emptiableStringAndNullishString),
	buildFilteredNullishArrayCodec(z.string(), nonEmptyStringSchema),
);

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: fromArrayOfNonEmptyStrings,
	fromOutput: fromArrayOfNullishStrings,
	inputSchema,
	outputSchema,
} as const satisfies Codec<Nullish<Nullish<string>[]>, string[]>;
