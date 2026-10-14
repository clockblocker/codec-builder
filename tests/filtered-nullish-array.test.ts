import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const { buildFilteredNullishArrayCodec } = codecBuilder.helpers;

describe("buildFilteredNullishArrayCodec", () => {
	test("drops only null and undefined items", () => {
		const numbers = buildFilteredNullishArrayCodec(
			z.number().nullish(),
			z.number(),
		);
		expect(numbers.decode([0, null, 1, undefined, -0])).toEqual([0, 1, -0]);

		const booleans = buildFilteredNullishArrayCodec(
			z.boolean().nullish(),
			z.boolean(),
		);
		expect(booleans.decode([false, null, true])).toEqual([false, true]);

		const strings = buildFilteredNullishArrayCodec(z.string().nullish());
		expect(strings.decode(["", null, "a"])).toEqual(["", "a"]);
	});

	test("still validates the remaining items against the output schema", () => {
		const nonEmpty = buildFilteredNullishArrayCodec(
			z.string().nullish(),
			z.string().min(1),
		);
		expect(() => nonEmpty.decode(["a", "", null])).toThrow(z.ZodError);
		expect(nonEmpty.decode(["a", null, "b"])).toEqual(["a", "b"]);
	});

	test("encodes the array unchanged", () => {
		const numbers = buildFilteredNullishArrayCodec(
			z.number().nullish(),
			z.number(),
		);
		expect(numbers.encode([0, 1])).toEqual([0, 1]);
	});
});
