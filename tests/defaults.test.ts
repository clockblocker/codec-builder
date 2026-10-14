import { describe, expect, test } from "bun:test";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

describe("defaults are evaluated per decode", () => {
	test("the default Date is created at decode time", async () => {
		const codec = c.nonNullish.date.and.nullish.isoString;

		const first = codec.decode(null);
		await Bun.sleep(5);
		const before = Date.now();
		const second = codec.decode(undefined);

		expect(second).not.toBe(first);
		expect(second.getTime()).toBeGreaterThanOrEqual(before);
		expect(second.getTime()).toBeGreaterThan(first.getTime());
	});

	test("the default ISO string is created at decode time", async () => {
		const codec = c.nonNullish.isoString.and.nullish.date;

		const before = Date.now();
		await Bun.sleep(5);
		const decoded = codec.decode(null);

		expect(new Date(decoded).getTime()).toBeGreaterThan(before);
	});

	test("toNonNullishWithDefault calls a default factory on each decode", () => {
		let calls = 0;
		const codec = h.toNonNullishWithDefault(
			h.toNullable(c.nonNullish.number.and.numericString),
			() => {
				calls += 1;
				return -1;
			},
		);

		expect(calls).toBe(0);
		expect(codec.decode("2")).toBe(2);
		expect(calls).toBe(0);
		expect(codec.decode(null)).toBe(-1);
		expect(codec.decode(undefined)).toBe(-1);
		expect(calls).toBe(2);
	});

	test("toNonNullishWithDefault still accepts a plain value", () => {
		const codec = h.toNonNullishWithDefault(
			h.toNullable(c.nonNullish.number.and.numericString),
			-1,
		);

		expect(codec.decode(null)).toBe(-1);
	});

	test("an array default is not shared between decodes", () => {
		const codec = h.toNonNullishWithDefault(
			h.toNullable(h.toArrayOf(c.nonNullish.number.and.numericString)),
			() => [],
		);

		const first = codec.decode(null);
		first.push(1);

		expect(codec.decode(null)).toEqual([]);
	});
});
