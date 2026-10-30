import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";

const c = codecBuilder.fieldCodec;

// -- Optional keys --
//
// Effect marks optional keys on the field (`optionalKey`, `optional`), and
// key optionality follows the same rules as the Zod builder: noOp, nested
// and arrayOf fields keep the source key's, a codec field's Type key is
// optional when the codec's is (`optional.*`, `nullish.*`), and a codec
// still runs on a missing key when it handles one (`nullable.*` gives null).

const row = Schema.Struct({
	id: Schema.Number,
	nick: Schema.optional(Schema.String),
	born: Schema.optional(Schema.String),
	address: Schema.optional(Schema.Struct({ street: Schema.String })),
	tags: Schema.optionalKey(Schema.Array(Schema.String)),
	name: Schema.optional(Schema.NullOr(Schema.String)),
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	id: c.noOp,
	nick: c.noOp,
	born: c.optional.date.and.isoString,
	address: { street: c.noOp },
	tags: c.arrayOf(c.noOp),
	name: c.nullable.string.and.string,
});

type Expected = {
	readonly id: number;
	readonly nick?: string | undefined;
	readonly born?: Date | undefined;
	readonly address?: { readonly street: string } | undefined;
	readonly tags?: ReadonlyArray<string>;
	readonly name: string | null;
};
type _type = Expect<Equal<typeof codec.Type, Expected>>;
type _to = Expect<Equal<typeof codec.to.Type, Expected>>;
type _encoded = Expect<Equal<typeof codec.Encoded, typeof row.Encoded>>;

describe("optional keys", () => {
	test("a missing key stays missing in decode and encode", () => {
		const decoded = Schema.decodeSync(codec)({ id: 1 });
		// nullable.string.and.string turns a missing value into null
		expect(decoded).toEqual({ id: 1, name: null });
		expect(Object.keys(decoded).sort()).toEqual(["id", "name"]);

		const encoded = Schema.encodeSync(codec)({ id: 1, name: null });
		expect(Object.keys(encoded).sort()).toEqual(["id", "name"]);
	});

	test("a present key stays present, even when it is undefined", () => {
		const decoded = Schema.decodeSync(codec)({
			id: 1,
			nick: undefined,
			born: undefined,
			name: "a",
		});
		expect(Object.keys(decoded).sort()).toEqual([
			"born",
			"id",
			"name",
			"nick",
		]);
	});

	test("present optional values are still converted", () => {
		const input = {
			id: 1,
			nick: "n",
			born: "2024-01-02T00:00:00.000Z",
			address: { street: "Main" },
			tags: ["t"],
			name: "a",
		};
		const decoded = Schema.decodeSync(codec)(input);
		expect(decoded.born).toEqual(new Date("2024-01-02"));
		expect(Schema.encodeSync(codec)(decoded)).toEqual(input);
	});

	test("the derived schema accepts the missing keys", () => {
		expect(Schema.is(codec.to)({ id: 1, name: null })).toBeTrue();
		expect(Schema.is(codec.to)({ id: 1 })).toBeFalse();
	});

	test("nonNullish defaults fill a missing key", () => {
		const defaulted = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({ count: Schema.optionalKey(Schema.String) }),
			{ count: c.nonNullish.number.and.nullish.numericString },
		);
		type _count = Expect<
			Equal<typeof defaulted.Type, { readonly count: number }>
		>;
		expect(Schema.decodeSync(defaulted)({})).toEqual({ count: 0 });
		expect(Schema.encodeSync(defaulted)({ count: 2 })).toEqual({
			count: "2",
		});
	});

	test("nullish codecs keep null, undefined and a missing key", () => {
		const nullish = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({
				at: Schema.optionalKey(Schema.NullishOr(Schema.String)),
			}),
			{ at: c.nullish.date.and.isoString },
		);
		type _at = Expect<
			Equal<
				typeof nullish.Type,
				{ readonly at?: Date | null | undefined }
			>
		>;
		expect(Schema.decodeSync(nullish)({})).toEqual({});
		expect(Schema.decodeSync(nullish)({ at: null })).toEqual({ at: null });
		expect(Schema.decodeSync(nullish)({ at: undefined })).toEqual({
			at: undefined,
		});
		expect(Schema.encodeSync(nullish)({})).toEqual({});
	});
});

// -- Nullable and optional nested structs and arrays --

const nestedRow = Schema.Struct({
	address: Schema.NullOr(
		Schema.Struct({
			street: Schema.String,
			vip: Schema.Literals(["Yes", "No"]),
		}),
	),
	billing: Schema.optional(Schema.Struct({ street: Schema.String })),
	contact: Schema.optional(
		Schema.NullOr(Schema.Struct({ email: Schema.String })),
	),
	tags: Schema.NullOr(Schema.Array(Schema.String)),
	lines: Schema.optional(Schema.Array(Schema.Struct({ qty: Schema.String }))),
	prices: Schema.NullishOr(Schema.Array(Schema.String)),
});

const nested = codecBuilder.buildStrictFieldAdapterCodec(nestedRow, {
	address: { street: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	billing: { street: c.noOp },
	contact: { email: c.noOp },
	tags: c.arrayOf(c.noOp),
	lines: c.arrayOf({ qty: c.nonNullish.int.and.numericString }),
	prices: c.arrayOf(c.nonNullish.number.and.numericString),
});

type Out = typeof nested.Type;
type _address = Expect<
	Equal<
		Out["address"],
		{ readonly street: string; readonly vip: boolean } | null
	>
>;
type _billing = Expect<
	Equal<Out["billing"], { readonly street: string } | undefined>
>;
type _contact = Expect<
	Equal<Out["contact"], { readonly email: string } | null | undefined>
>;
type _tags = Expect<Equal<Out["tags"], ReadonlyArray<string> | null>>;
type _lines = Expect<
	Equal<Out["lines"], ReadonlyArray<{ readonly qty: number }> | undefined>
>;
type _prices = Expect<
	Equal<Out["prices"], ReadonlyArray<number> | null | undefined>
>;
type _nestedEncoded = Expect<
	Equal<typeof nested.Encoded, typeof nestedRow.Encoded>
>;

describe("nullable and optional nested structs and arrays", () => {
	const nulls = {
		address: null,
		billing: undefined,
		contact: null,
		tags: null,
		lines: undefined,
		prices: null,
	};

	test("null and undefined pass through decode and encode", () => {
		expect(Schema.decodeSync(nested)(nulls)).toEqual(nulls);
		expect(Schema.encodeSync(nested)(nulls)).toEqual(nulls);
		expect(
			Schema.decodeSync(nested)({ ...nulls, contact: undefined }),
		).toEqual({ ...nulls, contact: undefined });
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
		expect(Schema.decodeSync(nested)(input)).toEqual(output);
		expect(Schema.encodeSync(nested)(output)).toEqual(input);
	});

	test("the derived schema keeps the wrappers", () => {
		expect(Schema.is(nested.to)(nulls)).toBeTrue();
		// a null array still has to be null, not some other value
		expect(Schema.is(nested.to)({ ...nulls, tags: 1 })).toBeFalse();
		expect(
			Schema.is(nested.to)({
				...nulls,
				address: { street: "M", vip: "Yes" },
			}),
		).toBeFalse();
	});
});
