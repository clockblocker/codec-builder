import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;

const row = z.object({
	address: z
		.object({ street: z.string(), vip: z.enum(["Yes", "No"]) })
		.nullable(),
	billing: z.object({ street: z.string() }).optional(),
	contact: z.object({ email: z.string() }).nullish(),
	tags: z.array(z.string()).nullable(),
	lines: z.array(z.object({ qty: z.string() })).optional(),
	prices: z.array(z.string()).nullish(),
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	address: { street: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	billing: { street: c.noOp },
	contact: { email: c.noOp },
	tags: c.arrayOf(c.noOp),
	lines: c.arrayOf({ qty: c.nonNullish.int.and.numericString }),
	prices: c.arrayOf(c.nonNullish.number.and.numericString),
});

type Out = z.output<typeof codec>;
type _address = Expect<
	Equal<Out["address"], { street: string; vip: boolean } | null>
>;
type _billing = Expect<Equal<Out["billing"], { street: string } | undefined>>;
type _contact = Expect<
	Equal<Out["contact"], { email: string } | null | undefined>
>;
type _tags = Expect<Equal<Out["tags"], string[] | null>>;
type _lines = Expect<Equal<Out["lines"], { qty: number }[] | undefined>>;
type _prices = Expect<Equal<Out["prices"], number[] | null | undefined>>;

type ApiUser = {
	address: { street: string; vip: "Yes" | "No" } | null;
	billing: { street: string } | undefined;
	tags: string[] | null;
	lines: { qty: string }[] | null | undefined;
};

const adapter = codecBuilder.buildStrictFieldAdapter<ApiUser>()({
	address: { street: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	billing: { street: c.noOp },
	tags: c.arrayOf(c.noOp),
	lines: c.arrayOf({ qty: c.nonNullish.int.and.numericString }),
});

type AdapterOut = ReturnType<typeof adapter.decode>;
type _adapterAddress = Expect<
	Equal<AdapterOut["address"], { street: string; vip: boolean } | null>
>;
type _adapterBilling = Expect<
	Equal<AdapterOut["billing"], { street: string } | undefined>
>;
type _adapterTags = Expect<Equal<AdapterOut["tags"], string[] | null>>;
type _adapterLines = Expect<
	Equal<AdapterOut["lines"], { qty: number }[] | null | undefined>
>;

describe("nullable and optional nested objects and arrays", () => {
	const nulls = {
		address: null,
		billing: undefined,
		contact: null,
		tags: null,
		lines: undefined,
		prices: null,
	};

	test("null and undefined pass through decode and encode", () => {
		expect(codec.decode(nulls)).toEqual(nulls);
		expect(codec.encode(nulls)).toEqual(nulls);
		expect(
			codec.safeDecode({ ...nulls, contact: undefined }).success,
		).toBeTrue();
	});

	test("present values are still converted", () => {
		const input = {
			address: { street: "Main", vip: "Yes" as const },
			billing: { street: "Side" },
			contact: { email: "a@b.c" },
			tags: ["x"],
			lines: [{ qty: "2" }],
			prices: ["1.5"],
		};
		const output = {
			address: { street: "Main", vip: true },
			billing: { street: "Side" },
			contact: { email: "a@b.c" },
			tags: ["x"],
			lines: [{ qty: 2 }],
			prices: [1.5],
		};
		expect(codec.decode(input)).toEqual(output);
		expect(codec.encode(output)).toEqual(input);
	});

	test("the derived schema keeps the wrappers", () => {
		expect(codec.out.shape.address).toBeInstanceOf(z.ZodNullable);
		expect(codec.out.shape.billing).toBeInstanceOf(z.ZodOptional);
		expect(codec.out.shape.contact.unwrap()).toBeInstanceOf(z.ZodNullable);
		expect(codec.out.shape.tags).toBeInstanceOf(z.ZodNullable);
		expect(codec.out.safeParse(nulls).success).toBeTrue();
		// a null array still has to be null, not some other value
		expect(codec.out.safeParse({ ...nulls, tags: 1 }).success).toBeFalse();
	});

	test("the schema-free adapter passes null and undefined through", () => {
		const value = {
			address: null,
			billing: undefined,
			tags: null,
			lines: null,
		};
		expect(adapter.decode(value)).toEqual(value);
		expect(adapter.encode(value)).toEqual(value);
		expect(
			adapter.decode({
				address: { street: "Main", vip: "No" },
				billing: undefined,
				tags: ["a"],
				lines: [{ qty: "3" }],
			}),
		).toEqual({
			address: { street: "Main", vip: false },
			billing: undefined,
			tags: ["a"],
			lines: [{ qty: 3 }],
		});
	});
});
