import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { z } from "zod/v3";
import { codecBuilder3 as codecBuilder } from "../src/v3";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

afterEach(() => {
	setSystemTime();
});

describe("lazy defaults", () => {
	test("the default Date is created at decode time, not import time", () => {
		const codec = c.nonNullish.date.and.nullish.isoString;

		setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
		const first = codec.fromInput(null);
		setSystemTime(new Date("2031-06-15T12:00:00.000Z"));
		const second = codec.fromInput(undefined);

		expect(first.toISOString()).toBe("2030-01-01T00:00:00.000Z");
		expect(second.toISOString()).toBe("2031-06-15T12:00:00.000Z");
		expect(first).not.toBe(second);
	});

	test("mutating a default Date does not leak into the next decode", () => {
		const codec = c.nonNullish.date.and.isoString;
		setSystemTime(new Date("2030-01-01T00:00:00.000Z"));

		codec.fromInput(null).setFullYear(1999);

		expect(codec.fromInput(null).toISOString()).toBe(
			"2030-01-01T00:00:00.000Z",
		);
	});

	test("the default ISO string is created at decode time", () => {
		const codec = c.nonNullish.isoString.and.nullish.date;

		setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
		expect(codec.fromInput(null)).toBe("2030-01-01T00:00:00.000Z");
		setSystemTime(new Date("2031-06-15T12:00:00.000Z"));
		expect(codec.fromInput(undefined)).toBe("2031-06-15T12:00:00.000Z");
	});

	test("toNonNullishWithDefault calls a factory on every decode", () => {
		let calls = 0;
		const codec = h.toNonNullishWithDefault(
			h.toNullable({
				fromInput: (v: string[]) => ({ tags: v }),
				fromOutput: (v: { tags: string[] }) => v.tags,
				inputSchema: z.array(z.string()),
				outputSchema: z.object({ tags: z.array(z.string()) }),
			}),
			() => {
				calls += 1;
				return { tags: [] };
			},
		);

		expect(calls).toBe(0);
		const first = codec.fromInput(null);
		first.tags.push("mutated");
		const second = codec.fromInput(undefined);

		expect(calls).toBe(2);
		expect(second).toEqual({ tags: [] });
		expect(first).not.toBe(second);
		expect(codec.fromInput(["a"])).toEqual({ tags: ["a"] });
		expect(calls).toBe(2);
	});

	test("toNonNullishWithDefault still accepts a plain value", () => {
		const codec = h.toNonNullishWithDefault(
			h.toNullable(c.nonNullish.number.and.numericString),
			-1,
		);

		expect(codec.fromInput(null)).toBe(-1);
		expect(codec.fromInput("2")).toBe(2);
	});

	test("the empty-array default is not shared between decodes", () => {
		const codec =
			c.nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString;
		const first = codec.fromInput(null);
		first.push("mutated");

		expect(codec.fromInput(undefined)).toEqual([]);
	});
});
