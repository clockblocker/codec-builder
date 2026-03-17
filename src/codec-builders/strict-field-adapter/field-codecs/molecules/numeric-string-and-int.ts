import { z } from "zod";
import type { Nullish } from "../../../../core/helpers/helper-types";
import { reverseCodecDirections } from "../../../../core/helpers/reverse-codec-directions";
import { pipeCodecs } from "../../../../core/pipe-codecs";
import type { Codec, SchemaCodec } from "../../../../core/types";
import {
	numericStringAndNullishNumber,
	numericStringAndNumber,
} from "./atoms/numeric-string-and-nullish-number";

const intSchema = z.number().int();
const numberSchema = z.number();
const nullishIntSchema = intSchema.nullish();
const nullishNumberSchema = numberSchema.nullish();

const intAndNumber = {
	fromInput: (v) => (v ? Math.floor(v) : v),
	fromOutput: (v) => v,
	inputSchema: numberSchema,
	outputSchema: intSchema,
} as const satisfies SchemaCodec<typeof numberSchema, typeof intSchema>;

const numberAndInt = reverseCodecDirections(intAndNumber);

const intAndNullishNumber = {
	fromInput: (v) => (v ? Math.floor(v) : v),
	fromOutput: (v) => v,
	inputSchema: nullishNumberSchema,
	outputSchema: nullishIntSchema,
} as const satisfies SchemaCodec<typeof nullishNumberSchema, typeof nullishIntSchema>;

const nullishNumberAndInt = reverseCodecDirections(intAndNullishNumber);

export const numericStringAndInt = pipeCodecs(
	numberAndInt,
	numericStringAndNumber,
) satisfies Codec<string, number>;

export const intAndNumericString = reverseCodecDirections(numericStringAndInt);

export const nullableNumericStringAndNullishInt = pipeCodecs(
	nullishNumberAndInt,
	numericStringAndNullishNumber,
) satisfies Codec<string | null, Nullish<number>>;

export const nullishIntAndNullableNumericString = reverseCodecDirections(
	nullableNumericStringAndNullishInt,
);

export const numericStringAndNullishInt = nullableNumericStringAndNullishInt;
export const intAndNullableNumericString = nullishIntAndNullableNumericString;
