import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

const sleep = (ms = 1) => new Promise((resolve) => setTimeout(resolve, ms));

// Counts unhandled rejections during each test; every test expects none.
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

const runs = { decode: 0, encode: 0 };
// An async transform in both directions, counting its runs.
const asyncNumber = z.codec(z.string(), z.number(), {
	decode: async (value) => {
		runs.decode++;
		await sleep();
		return Number(value);
	},
	encode: async (value) => {
		runs.encode++;
		await sleep();
		return String(value);
	},
});
const asyncOptionalNumber = z.codec(
	z.string().optional(),
	z.number().optional(),
	{
		decode: async (value) =>
			value === undefined ? undefined : Number(value),
		encode: async (value) =>
			value === undefined ? undefined : String(value),
	},
);
// A sync transform with an async refine on its out side.
const nonNegative = z.codec(
	z.string(),
	z.number().refine(async (value) => {
		await sleep();
		return value >= 0;
	}, "must not be negative"),
	{ decode: Number, encode: String },
);

const row = z.object({
	id: z.number(),
	balance: z.string(),
	nested: z.object({ amount: z.string() }),
	items: z.array(z.object({ price: z.string() })),
	note: z.string().optional(),
	vip: z.enum(["Yes", "No"]),
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	id: c.noOp,
	balance: asyncNumber,
	nested: { amount: asyncNumber },
	items: c.arrayOf({ price: nonNegative }),
	note: asyncOptionalNumber,
	vip: c.nonNullish.boolean.and.yesNo,
});

const input = {
	id: 1,
	balance: "12.5",
	nested: { amount: "3" },
	items: [{ price: "1" }, { price: "2" }],
	vip: "Yes" as const,
};
const output = {
	id: 1,
	balance: 12.5,
	nested: { amount: 3 },
	items: [{ price: 1 }, { price: 2 }],
	vip: true,
};

describe("async field codecs", () => {
	test("decodeAsync and encodeAsync work, in nested shapes and arrayOf", async () => {
		const decoded = await codec.decodeAsync(input);
		expect(decoded).toEqual(output);
		expect("note" in decoded).toBeFalse();
		expect(await codec.encodeAsync(output)).toEqual(input);
		expect(await z.decodeAsync(codec, { ...input, note: "3" })).toEqual({
			...output,
			note: 3,
		});
	});

	test("each async transform runs once per field", async () => {
		runs.decode = 0;
		runs.encode = 0;
		await codec.decodeAsync(input);
		expect(runs).toEqual({ decode: 2, encode: 0 });
		await codec.encodeAsync(output);
		expect(runs).toEqual({ decode: 2, encode: 2 });
	});

	test("safe async methods report failures with their path", async () => {
		const result = await codec.safeDecodeAsync({
			...input,
			items: [{ price: "1" }, { price: "-2" }],
		});
		expect(result.success).toBeFalse();
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([
			["items", 1, "price"],
		]);
		expect(result.error?.issues[0]?.message).toBe("must not be negative");

		const encoded = await codec.safeEncodeAsync({
			...output,
			items: [{ price: -1 }],
		});
		expect(encoded.success).toBeFalse();
		expect(encoded.error?.issues.map((issue) => issue.path)).toEqual([
			["items", 0, "price"],
		]);
	});

	test("sync calls keep Zod's async error", () => {
		expect(() => codec.decode(input)).toThrow(z.core.$ZodAsyncError);
		expect(() => codec.safeDecode(input)).toThrow(z.core.$ZodAsyncError);
		expect(() => codec.encode(output)).toThrow(z.core.$ZodAsyncError);
	});

	test("an async throw rejects decodeAsync without an unhandled rejection", async () => {
		const failing = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ a: z.string(), b: z.string() }),
			{
				a: z.codec(z.string(), z.number(), {
					decode: async () => {
						await sleep();
						throw new Error("boom");
					},
					encode: String,
				}),
				b: nonNegative,
			},
		);
		await expect(failing.decodeAsync({ a: "1", b: "1" })).rejects.toThrow(
			"boom",
		);
		expect(() => failing.decode({ a: "1", b: "1" })).toThrow(
			z.core.$ZodAsyncError,
		);
	});

	test("a sync-only codec still decodes with either API", async () => {
		const sync = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ vip: z.enum(["Yes", "No"]) }),
			{ vip: c.nonNullish.boolean.and.yesNo },
		);
		expect(sync.decode({ vip: "No" })).toEqual({ vip: false });
		expect(await sync.decodeAsync({ vip: "No" })).toEqual({ vip: false });
	});

	test("the schema-free adapter's sync decode throws Zod's async error", () => {
		const adapter = codecBuilder.buildStrictFieldAdapter<{
			balance: string;
		}>()({ balance: asyncNumber });
		expect(() => adapter.decode({ balance: "1" })).toThrow(
			z.core.$ZodAsyncError,
		);
	});
});

describe("async codecs in pipeCodecs", () => {
	const pipeRuns = { left: 0, right: 0 };
	const toUpper = z.codec(
		z.string(),
		z.string().refine(async (value) => {
			await sleep();
			return value.length <= 3;
		}, "too long"),
		{
			decode: (value) => {
				pipeRuns.right++;
				return value.toUpperCase();
			},
			encode: (value) => value.toLowerCase(),
		},
	);
	const piped = h.pipeCodecs(
		z.codec(z.number(), z.string(), {
			decode: async (value) => {
				pipeRuns.left++;
				await sleep();
				return String(value);
			},
			encode: Number,
		}),
		toUpper,
	);

	test("decodeAsync and encodeAsync run both codecs, once each", async () => {
		pipeRuns.left = 0;
		pipeRuns.right = 0;
		expect(await piped.decodeAsync(123)).toBe("123");
		expect(pipeRuns).toEqual({ left: 1, right: 1 });
		expect(await piped.encodeAsync("123")).toBe(123);
	});

	test("failures are reported, not thrown", async () => {
		const result = await piped.safeDecodeAsync(12345);
		expect(result.success).toBeFalse();
		expect(result.error?.issues[0]?.message).toBe("too long");
	});

	test("sync calls keep Zod's async error", () => {
		expect(() => piped.decode(1)).toThrow(z.core.$ZodAsyncError);
	});
});
