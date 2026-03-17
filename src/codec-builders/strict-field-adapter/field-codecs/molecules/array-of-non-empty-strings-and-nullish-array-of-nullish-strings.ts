import { z } from "zod";
import type { Nullish } from "../../../../core/helpers/nullish-utils";
import { pipeCodecs } from "../../../../core/pipe-codecs";
import type { Codec } from "../../../../core/types";
import { buildFilteredNullishArrayCodec } from "../../builders/filtered-nullish-array";
import { toArrayOf } from "../../helpers/to-array-of";
import { toNonNullableWithDefault } from "../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../helpers/to-nullable";
import { stringAndNullish } from "./nullish-string-and-emptiable-string";

const nonEmptyStringSchema = z.string().min(1);
const stringAndNullishString = toNonNullableWithDefault(
	toNullable(stringAndNullish),
	"",
);
const arrayOfNullishStrings = toArrayOf(stringAndNullishString);
const nullishArrayOfStrings = toNonNullableWithDefault(
	toNullable(arrayOfNullishStrings),
	[],
);

const {
	inputSchema,
	outputSchema,
	fromOutput: fromArrayOfNullishStrings,
	fromInput: fromArrayOfNonEmptyStrings,
} = pipeCodecs(
	nullishArrayOfStrings,
	buildFilteredNullishArrayCodec(z.string(), nonEmptyStringSchema),
);

export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings = {
	fromInput: fromArrayOfNonEmptyStrings,
	fromOutput: fromArrayOfNullishStrings,
	inputSchema,
	outputSchema,
} as const satisfies Codec<string[], Nullish<Nullish<string>[]>>;
