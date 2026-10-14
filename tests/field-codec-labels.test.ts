import { describe, expect, test } from "bun:test";
import type { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Expect } from "./type-helpers";

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

const c = codecBuilder.fieldCodec;
const iso = "2024-01-02T03:04:05.000Z";
const date = new Date(iso);

// Each path reads <nullability>.<derived>.and.<source>; the types must match.
type _labels = [
	Expect<Equal<z.input<typeof c.nonNullish.date.and.isoString>, string>>,
	Expect<Equal<z.output<typeof c.nonNullish.date.and.isoString>, Date>>,
	Expect<
		Equal<z.input<typeof c.optional.date.and.isoString>, string | undefined>
	>,
	Expect<
		Equal<z.output<typeof c.optional.date.and.isoString>, Date | undefined>
	>,
	Expect<
		Equal<
			z.output<typeof c.nullish.date.and.isoString>,
			Date | null | undefined
		>
	>,
];

describe("field codec paths match their labels", () => {
	test("nonNullish.date.and.isoString takes an ISO string, not a nullish one", () => {
		const codec = c.nonNullish.date.and.isoString;

		expect(codec).not.toBe(c.nonNullish.date.and.nullish.isoString);
		expect(codec.decode(iso)).toEqual(date);
		expect(codec.encode(date)).toBe(iso);
		expect(codec.safeDecode(null as never).success).toBeFalse();
		expect(codec.safeDecode(undefined as never).success).toBeFalse();
		expect(codec.safeDecode("yesterday").success).toBeFalse();
	});

	test("optional.date.and.isoString only adds undefined", () => {
		const codec = c.optional.date.and.isoString;

		expect(codec.decode(undefined)).toBeUndefined();
		expect(codec.decode(iso)).toEqual(date);
		expect(codec.encode(undefined)).toBeUndefined();
		expect(codec.safeDecode(null as never).success).toBeFalse();
		expect(codec.safeEncode(null as never).success).toBeFalse();
	});

	test("nullish.date.and.isoString keeps null and undefined as they are", () => {
		const codec = c.nullish.date.and.isoString;

		expect(codec.decode(null)).toBeNull();
		expect(codec.decode(undefined)).toBeUndefined();
		expect(codec.encode(null)).toBeNull();
		expect(codec.encode(undefined)).toBeUndefined();
		expect(codec.decode(iso)).toEqual(date);
	});

	test("the never-nullable nullable.array entry is gone", () => {
		expect("array" in c.nullable).toBeFalse();
		expect(
			c.nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString.decode(
				null,
			),
		).toEqual([]);
	});
});
