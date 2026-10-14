import { describe, expect, test } from "bun:test";
import { z } from "zod/v3";
import { codecBuilder3 as codecBuilder } from "../src/v3";

describe("buildFilteredNullishArrayCodec", () => {
	test("drops only null and undefined, keeping other falsy values", () => {
		const codec = codecBuilder.helpers.buildFilteredNullishArrayCodec(
			z.union([z.number(), z.boolean(), z.string()]).nullish(),
			z.union([z.number(), z.boolean(), z.string()]),
		);

		expect(
			codec.fromInput([0, null, false, undefined, "", Number.NaN, 1]),
		).toEqual([0, false, "", Number.NaN, 1]);
		expect(codec.fromOutput([0, false, ""])).toEqual([0, false, ""]);
	});
});
