import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;
const build = codecBuilder.buildStrictFieldAdapterCodec;

// Object fields can take noOp or a codec for the whole object, not only a
// nested shape, including nullable and optional object fields.

class Address {
	constructor(readonly street: string) {}
}

const addressSchema = z.object({ street: z.string() });
const addressToClass = z.codec(addressSchema, z.instanceof(Address), {
	decode: (value) => new Address(value.street),
	encode: (address) => ({ street: address.street }),
});
const addressToString = z.codec(addressSchema, z.string(), {
	decode: (value) => value.street,
	encode: (street) => ({ street }),
});

const row = z.object({
	home: addressSchema,
	work: addressSchema.nullable(),
	billing: addressSchema.optional(),
	meta: z.object({ a: z.number() }),
	extra: z.object({ a: z.number() }).nullish(),
});

const codec = build(row, {
	home: addressToString,
	work: h.toNullable(addressToClass),
	billing: h.toOptional(addressToString),
	meta: c.noOp,
	extra: c.noOp,
});

type _out = Expect<
	Equal<
		z.output<typeof codec>,
		{
			home: string;
			work: Address | null;
			billing?: string | undefined;
			meta: { a: number };
			extra?: { a: number } | null | undefined;
		}
	>
>;

type ApiUser = {
	home: { street: string };
	work: { street: string } | null;
};

const adapter = codecBuilder.buildStrictFieldAdapter<ApiUser>()({
	home: addressToString,
	work: c.noOp,
});

type _adapterOut = Expect<
	Equal<
		ReturnType<typeof adapter.decode>,
		{ home: string; work: { street: string } | null }
	>
>;

const rejected = () => [
	build(row, {
		home: addressToString,
		// @ts-expect-error a non-nullable codec cannot decode a nullable field
		work: addressToClass,
		billing: h.toOptional(addressToString),
		meta: c.noOp,
		extra: c.noOp,
	}),
	build(row, {
		// @ts-expect-error encodes null, which the non-nullable field rejects
		home: h.toNullable(addressToString),
		work: h.toNullable(addressToClass),
		billing: h.toOptional(addressToString),
		meta: c.noOp,
		extra: c.noOp,
	}),
	build(z.object({ home: addressSchema }), {
		// @ts-expect-error the codec's input object has a different shape
		home: z.codec(z.object({ street: z.number() }), z.string(), {
			decode: String,
			encode: () => ({ street: 0 }),
		}),
	}),
	codecBuilder.buildStrictFieldAdapter<ApiUser>()({
		// @ts-expect-error the schema-free adapter checks object codecs too
		home: c.nonNullish.number.and.numericString,
		work: c.noOp,
	}),
];

describe("noOp and codecs on object fields", () => {
	const input = {
		home: { street: "Main" },
		work: { street: "Side" },
		billing: { street: "Bill" },
		meta: { a: 1 },
		extra: null,
	};

	test("decode and encode round-trip", () => {
		const decoded = codec.decode(input);
		expect(decoded.home).toBe("Main");
		expect(decoded.work).toBeInstanceOf(Address);
		expect(decoded.work?.street).toBe("Side");
		expect(decoded.billing).toBe("Bill");
		expect(decoded.meta).toEqual({ a: 1 });
		expect(decoded.extra).toBeNull();
		expect(codec.encode(decoded)).toEqual(input);
	});

	test("nullable and optional object fields pass null and undefined", () => {
		const decoded = codec.decode({
			home: { street: "Main" },
			work: null,
			meta: { a: 1 },
		});
		expect(decoded).toEqual({ home: "Main", work: null, meta: { a: 1 } });
		expect(Object.keys(codec.encode(decoded)).sort()).toEqual([
			"home",
			"meta",
			"work",
		]);
	});

	test("the derived schema uses the codec's out or the field's schema", () => {
		expect(codec.out.shape.home).toBe(addressToString.out);
		expect(codec.out.shape.meta).toBe(row.shape.meta);
		expect(
			codec.out.safeParse({ ...codec.decode(input), meta: {} }).success,
		).toBeFalse();
	});

	test("the schema-free adapter takes object codecs and noOp", () => {
		const value = { home: { street: "Main" }, work: null };
		expect(adapter.decode(value)).toEqual({ home: "Main", work: null });
		expect(adapter.encode({ home: "Main", work: null })).toEqual(value);
	});

	test("the rejected pairings are type errors only", () => {
		expect(rejected).toBeFunction();
	});
});
