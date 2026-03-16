import { z } from "zod";

import type { Codec } from "../../../types";

const intStringSchema = z.string().regex(/^-?\d+$/);
const nullishIntStringSchema = intStringSchema.nullish();
type NullishIntString = z.infer<typeof nullishIntStringSchema>;

const nullishIntSchema = z.number().int().nullish();
type NullishInt = z.infer<typeof nullishIntSchema>;

function intStringFromInt(v: number): string;
function intStringFromInt(v: NullishInt): NullishIntString;
function intStringFromInt(v: NullishInt): NullishIntString {
	return v == null ? undefined : String(v);
}

function intFromIntString(v: string): number;
function intFromIntString(v: NullishIntString): NullishInt;
function intFromIntString(v: NullishIntString): NullishInt {
	return v == null ? undefined : Number.parseInt(v, 10);
}

export const intStringAndInt = {
	fromInput: intStringFromInt,
	fromOutput: intFromIntString,
	outputSchema: nullishIntStringSchema,
} as const satisfies Codec<NullishIntString, NullishInt, typeof nullishIntStringSchema>;
