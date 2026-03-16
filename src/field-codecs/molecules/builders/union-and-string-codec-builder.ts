import { z } from "zod";

import type { Nullish } from "../../../core/helpers/helper-types";
import type { Codec } from "../../../core/types";
import {
	mapNullishToNullable,
	nullishToUndefined,
} from "../../../core/helpers/nullish-utils";

export function buildNullableUnionAndNullishString<
	const TValues extends NonEmptyStringTuple,
>(valuesOrEnum: TValues | z.ZodEnum<MutableNonEmptyStringTuple<TValues>>) {
	const enumSchema =
		valuesOrEnum instanceof z.ZodEnum
			? valuesOrEnum
			: z.enum(valuesOrEnum as MutableNonEmptyStringTuple<TValues>);

	const inputSchema = z.string().nullish();
	const outputSchema = enumSchema.nullable();
	const allowedValues = enumSchema.options as readonly TValues[number][];

	return {
		fromInput: (v: Nullish<string>): TValues[number] | null =>
			nullableUnionFromNullishString(v, allowedValues),
		fromOutput: (v: TValues[number] | null): TValues[number] | undefined =>
			nullishStringFromNullableUnion(v),
		inputSchema,
		outputSchema,
	} satisfies Codec<typeof inputSchema, typeof outputSchema>;
}

// -- Internals --

type NonEmptyStringTuple = readonly [string, ...string[]];
type MutableTuple<T extends readonly string[]> = [...T];
type MutableNonEmptyStringTuple<T extends NonEmptyStringTuple> =
	MutableTuple<T> extends [string, ...string[]] ? MutableTuple<T> : never;

function nullableUnionFromNullishString<TUnion extends string>(
	v: Nullish<string>,
	allowedValues: readonly TUnion[],
): TUnion | null {
	return mapNullishToNullable(v, value =>
		allowedValues.includes(value as TUnion) ? (value as TUnion) : null,
	);
}

function nullishStringFromNullableUnion<TUnion extends string>(
	v: Nullish<TUnion>,
): TUnion | undefined {
	return nullishToUndefined(v);
}
