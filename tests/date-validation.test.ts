import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;

const dateFromIsoCodecs = {
	"nullable.date.and.isoString": c.nullable.date.and.isoString,
	"nullish.date.and.isoString": c.nullish.date.and.isoString,
	"nonNullish.date.and.nullish.isoString":
		c.nonNullish.date.and.nullish.isoString,
} as const;

describe("date codecs validate the ISO string", () => {
	for (const [path, codec] of Object.entries(dateFromIsoCodecs)) {
		test(`${path} rejects strings that are not ISO dates`, () => {
			for (const garbage of [
				"",
				"yesterday",
				"2024-13-01",
				"2024-01-01T00:00:00",
				"01/02/2024",
			]) {
				expect(() => codec.decode(garbage)).toThrow(z.ZodError);
				expect(codec.safeDecode(garbage).success).toBeFalse();
			}
		});

		test(`${path} decodes ISO dates and datetimes`, () => {
			expect(codec.decode("2024-01-02")).toEqual(
				new Date("2024-01-02T00:00:00.000Z"),
			);
			expect(codec.decode("2024-01-02T03:04:05+02:00")).toEqual(
				new Date("2024-01-02T01:04:05.000Z"),
			);
		});
	}

	test("nullish input still maps to null or the default", () => {
		expect(c.nullable.date.and.isoString.decode(undefined)).toBeNull();
		expect(c.nullish.date.and.isoString.decode(undefined)).toBeUndefined();
		expect(
			c.nonNullish.date.and.nullish.isoString.decode(null),
		).toBeInstanceOf(Date);
	});

	test("an adapter field with a garbage date fails to decode", () => {
		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ at: z.string() }),
			{ at: c.nullable.date.and.isoString },
		);

		expect(() => codec.decode({ at: "yesterday" })).toThrow(z.ZodError);
		expect(codec.decode({ at: "2024-01-02" }).at).toEqual(
			new Date("2024-01-02"),
		);
	});
});
