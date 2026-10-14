import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;
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

const runs = { decode: 0, encode: 0 };
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
const asyncPositive = z.codec(
	z.string(),
	z.number().refine(async (value) => {
		await sleep();
		return value > 0;
	}, "must be positive"),
	{ decode: Number, encode: String },
);

type ApiRow = {
	balance: string;
	nested: { amount: string };
	items: { price: string }[];
	tags: string[] | null;
	vip: "Yes" | "No";
};

const adapter = codecBuilder.buildStrictFieldAdapter<ApiRow>()({
	balance: asyncNumber,
	nested: { amount: asyncNumber },
	items: c.arrayOf({ price: asyncPositive }),
	tags: h.toNullable(h.toArrayOf(asyncNumber)),
	vip: c.nonNullish.boolean.and.yesNo,
});

type Decoded = {
	balance: number;
	nested: { amount: number };
	items: { price: number }[];
	tags: number[] | null;
	vip: boolean;
};
type _decodeAsync = Expect<
	Equal<ReturnType<typeof adapter.decodeAsync>, Promise<Decoded>>
>;
type _encodeAsync = Expect<
	Equal<Parameters<typeof adapter.encodeAsync>[0], Decoded>
>;

const input: ApiRow = {
	balance: "1.5",
	nested: { amount: "2" },
	items: [{ price: "3" }],
	tags: ["4"],
	vip: "Yes",
};
const output: Decoded = {
	balance: 1.5,
	nested: { amount: 2 },
	items: [{ price: 3 }],
	tags: [4],
	vip: true,
};

describe("schema-free adapter async API", () => {
	test("decodeAsync and encodeAsync work with async field codecs", async () => {
		expect(await adapter.decodeAsync(input)).toEqual(output);
		expect(await adapter.encodeAsync(output)).toEqual(input);
	});

	test("each async transform runs once", async () => {
		runs.decode = 0;
		runs.encode = 0;
		await adapter.decodeAsync(input);
		expect(runs).toEqual({ decode: 3, encode: 0 });
		await adapter.encodeAsync(output);
		expect(runs).toEqual({ decode: 3, encode: 3 });
	});

	test("failures reject with a ZodError carrying the full path", async () => {
		const error = await adapter
			.decodeAsync({ ...input, items: [{ price: "1" }, { price: "-1" }] })
			.catch((reason: unknown) => reason);
		expect(error).toBeInstanceOf(z.ZodError);
		expect((error as z.ZodError).issues.map((issue) => issue.path)).toEqual(
			[["items", 1, "price"]],
		);
		expect((error as z.ZodError).issues[0]?.message).toBe(
			"must be positive",
		);
	});

	test("an async throw rejects without an unhandled rejection", async () => {
		const failing = codecBuilder.buildStrictFieldAdapter<{
			a: string;
			b: string;
		}>()({
			a: z.codec(z.string(), z.number(), {
				decode: async () => {
					await sleep();
					throw new Error("boom");
				},
				encode: String,
			}),
			b: asyncNumber,
		});
		await expect(failing.decodeAsync({ a: "1", b: "2" })).rejects.toThrow(
			"boom",
		);
	});

	test("sync decode still throws Zod's async error", () => {
		expect(() => adapter.decode(input)).toThrow(z.core.$ZodAsyncError);
		expect(() => adapter.encode(output)).toThrow(z.core.$ZodAsyncError);
	});

	test("a sync-only adapter works with either API", async () => {
		const sync = codecBuilder.buildStrictFieldAdapter<{
			vip: "Yes" | "No";
		}>()({ vip: c.nonNullish.boolean.and.yesNo });
		expect(sync.decode({ vip: "No" })).toEqual({ vip: false });
		expect(await sync.decodeAsync({ vip: "No" })).toEqual({ vip: false });
		expect(await sync.encodeAsync({ vip: true })).toEqual({ vip: "Yes" });
	});
});
