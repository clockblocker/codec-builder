import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const h = codecBuilder.helpers;
const sleep = (ms = 1) => new Promise((resolve) => setTimeout(resolve, ms));

let unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => {
	unhandled.push(reason);
};
beforeEach(() => {
	unhandled = [];
	process.on("unhandledRejection", onUnhandled);
});
afterEach(async () => {
	await sleep(20);
	process.off("unhandledRejection", onUnhandled);
	expect(unhandled).toEqual([]);
});

// The out side rejects negatives; the in side (on encode) rejects long codes.
const positive = z.codec(z.string().max(3), z.number().positive(), {
	decode: Number,
	encode: String,
});
// A transform that reports its own issue.
const flagged = z.codec(z.string(), z.number(), {
	decode: (value, payload) => {
		if (value === "bad") {
			payload.issues.push({
				code: "custom",
				message: "bad",
				input: value,
			});
		}
		return Number(value);
	},
	encode: String,
});

const paths = (error: z.ZodError | undefined) =>
	error?.issues.map((issue) => issue.path);

describe("helper casters report failures as issues", () => {
	test("toNullable, toOptional, toNullish", () => {
		for (const wrapped of [
			h.toNullable(positive),
			h.toOptional(positive),
			h.toNullish(positive),
		]) {
			const decoded = wrapped.safeDecode("-1");
			expect(decoded.success).toBeFalse();
			expect(paths(decoded.error)).toEqual([[]]);
			expect(wrapped.safeEncode(12345).success).toBeFalse();
			expect(wrapped.safeDecode("bad" as never).success).toBeFalse();
			expect(h.toNullable(flagged).safeDecode("bad").success).toBeFalse();
		}
	});

	test("toNonNullishWithDefault", () => {
		const defaulted = h.toNonNullishWithDefault(h.toNullable(positive), 1);
		expect(defaulted.decode(null)).toBe(1);
		expect(defaulted.safeDecode("-1").success).toBeFalse();
		expect(defaulted.safeEncode(12345).success).toBeFalse();
	});

	test("toArrayOf reports the item index", () => {
		const list = h.toArrayOf(positive);
		expect(paths(list.safeDecode(["1", "-1"]).error)).toEqual([[1]]);
		expect(
			paths(h.toArrayOf(flagged).safeDecode(["1", "bad"]).error),
		).toEqual([[1]]);
		expect(paths(list.safeEncode([1, 12345]).error)).toEqual([[1]]);
	});

	test("inside a strict adapter shape, the path is the full path", () => {
		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ prices: z.array(z.string()).nullable() }),
			{ prices: h.toNullable(h.toArrayOf(positive)) },
		);
		expect(paths(codec.safeDecode({ prices: ["1", "-1"] }).error)).toEqual([
			["prices", 1],
		]);
	});
});

describe("helper casters run the wrapped codec once", () => {
	test("a refine on the wrapped codec's out runs once per item", () => {
		let checks = 0;
		const counted = z.codec(
			z.string(),
			z.number().refine(() => {
				checks++;
				return true;
			}),
			{ decode: Number, encode: String },
		);
		h.toNullable(counted).decode("1");
		expect(checks).toBe(1);
		checks = 0;
		h.toArrayOf(counted).decode(["1", "2"]);
		expect(checks).toBe(2);
		checks = 0;
		h.toNonNullishWithDefault(h.toNullable(counted), 0).decode("1");
		expect(checks).toBe(1);
	});
});

describe("helper casters with async codecs", () => {
	let runs = 0;
	const asyncNumber = z.codec(z.string(), z.number(), {
		decode: async (value) => {
			runs++;
			await sleep();
			return Number(value);
		},
		encode: async (value) => {
			await sleep();
			return String(value);
		},
	});

	test("decodeAsync and encodeAsync work through every caster", async () => {
		runs = 0;
		expect(await h.toNullable(asyncNumber).decodeAsync("1")).toBe(1);
		expect(await h.toNullable(asyncNumber).decodeAsync(null)).toBeNull();
		expect(await h.toOptional(asyncNumber).decodeAsync("2")).toBe(2);
		expect(await h.toNullish(asyncNumber).decodeAsync(undefined)).toBe(
			undefined,
		);
		expect(await h.toArrayOf(asyncNumber).decodeAsync(["1", "2"])).toEqual([
			1, 2,
		]);
		expect(
			await h
				.toNonNullishWithDefault(h.toNullable(asyncNumber), 0)
				.decodeAsync(null),
		).toBe(0);
		expect(runs).toBe(4);
		expect(await h.toArrayOf(asyncNumber).encodeAsync([1, 2])).toEqual([
			"1",
			"2",
		]);
	});

	test("async failures are issues; sync calls throw Zod's async error", async () => {
		const asyncPositive = z.codec(
			z.string(),
			z.number().refine(async (value) => value > 0),
			{ decode: Number, encode: String },
		);
		const result = await h
			.toArrayOf(asyncPositive)
			.safeDecodeAsync(["1", "-1"]);
		expect(paths(result.error)).toEqual([[1]]);
		expect(() => h.toNullable(asyncNumber).decode("1")).toThrow(
			z.core.$ZodAsyncError,
		);
	});

	test("in a strict adapter shape", async () => {
		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ note: z.string().optional() }),
			{ note: h.toOptional(asyncNumber) },
		);
		expect(await codec.decodeAsync({ note: "3" })).toEqual({ note: 3 });
		expect(await codec.decodeAsync({})).toEqual({});
	});
});
