import { z } from "zod";

import type { Codec } from "../../core/types";

type NonEmptyStringTuple = readonly [string, ...string[]];
type MutableTuple<T extends readonly string[]> = [...T];
type MutableNonEmptyStringTuple<T extends NonEmptyStringTuple> =
	MutableTuple<T> extends [string, ...string[]] ? MutableTuple<T> : never;

function nullableUnionFromNullishString<TUnion extends string>(
	v: string | null | undefined,
	allowedValues: readonly TUnion[],
): TUnion | null {
	if (v == null) {
		return null;
	}

	return allowedValues.includes(v as TUnion) ? (v as TUnion) : null;
}

function nullishStringFromNullableUnion<TUnion extends string>(
	v: TUnion | null,
): TUnion | undefined {
	return v ?? undefined;
}

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
		fromInput: (v: string | null | undefined): TValues[number] | null =>
			nullableUnionFromNullishString(v, allowedValues),
		fromOutput: (v: TValues[number] | null): TValues[number] | undefined =>
			nullishStringFromNullableUnion(v),
		inputSchema,
		outputSchema,
	} satisfies Codec<
		TValues[number] | null,
		string | null | undefined,
		typeof inputSchema,
		typeof outputSchema
	>;
}
