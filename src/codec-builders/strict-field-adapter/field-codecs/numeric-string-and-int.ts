import { z } from "zod";
import type { Nullish } from "../../../core/helpers/helper-types";
import { reverseCodecDirections } from "../../../core/helpers/reverse-codec-directions";
import { pipeCodecs } from "../../../core/pipe-codecs";
import type { Codec, SchemaCodec } from "../../../core/types";
import { numericStringAndNullishNumber } from "./atoms/numeric-string-and-nullish-number";

const intSchema = z.number().int().nullish();
const floatSchema = z.number().nullish();

const intAndNullishNumber = {
	fromInput: (v) => (v ? Math.floor(v) : v),
	fromOutput: (v) => v,
	inputSchema: floatSchema,
	outputSchema: intSchema,
} as const satisfies SchemaCodec<typeof floatSchema, typeof intSchema>;

const nullishNumberAndInt = reverseCodecDirections(intAndNullishNumber);

export const numericStringAndInt = pipeCodecs(
	nullishNumberAndInt,
	numericStringAndNullishNumber,
) satisfies Codec<string | null, Nullish<number>>;

export const intAndNumericString = reverseCodecDirections(numericStringAndInt);
