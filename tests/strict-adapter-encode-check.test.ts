import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;
const build = codecBuilder.buildStrictFieldAdapterCodec;

// A codec must also fit the field in the encode direction: whatever it can
// encode has to be accepted by the field's schema.

const nullishToNullable = z.codec(z.string().nullish(), z.string().nullable(), {
	decode: (value) => value ?? null,
	encode: (value) => value,
});
const numberOrString = z.codec(z.union([z.number(), z.string()]), z.string(), {
	decode: String,
	encode: Number,
});

const rejected = () => [
	build(z.object({ nick: z.string().optional() }), {
		// @ts-expect-error encodes null, which an optional string rejects
		nick: c.nullable.string.and.string,
	}),
	build(z.object({ nick: z.string().optional() }), {
		// @ts-expect-error a custom codec whose encode returns string | null
		nick: nullishToNullable,
	}),
	build(z.object({ id: z.number() }), {
		// @ts-expect-error may encode a string into a number field
		id: numberOrString,
	}),
	build(z.object({ born: z.iso.datetime() }), {
		// @ts-expect-error encodes null, which a non-nullable string rejects
		born: c.nullable.date.and.isoString,
	}),
	build(z.object({ profile: z.object({ nick: z.string().optional() }) }), {
		// @ts-expect-error nested fields are checked too
		profile: { nick: c.nullable.string.and.string },
	}),
	build(z.object({ tags: z.array(z.string()) }), {
		// @ts-expect-error array items are checked too
		tags: c.arrayOf(c.nullable.string.and.string),
	}),
	codecBuilder.buildStrictFieldAdapter<{ nick?: string }>()({
		// @ts-expect-error the schema-free adapter checks encode too
		nick: c.nullable.string.and.string,
	}),
	codecBuilder.buildStrictFieldAdapter<{ ids: number[] }>()({
		// @ts-expect-error schema-free array items are checked too
		ids: c.arrayOf(numberOrString),
	}),
];

const accepted = build(
	z.object({
		middle_name: z.string().nullish(),
		deleted_at: z.iso.datetime().nullable(),
		created_at: z.iso.datetime(),
		is_admin: z.enum(["Yes", "No"]),
		flag: z.string(),
		label: z.string(),
		touched: z.iso.datetime(),
		maybe: z.iso.datetime().optional(),
	}),
	{
		middle_name: c.nullable.string.and.string,
		deleted_at: c.nullable.date.and.isoString,
		created_at: c.nonNullish.date.and.isoString,
		is_admin: c.nonNullish.boolean.and.yesNo,
		flag: c.nonNullish.boolean.and.yesNo,
		label: c.nonNullish.string.and.nullish.string,
		touched: c.nonNullish.date.and.nullish.isoString,
		maybe: c.optional.date.and.isoString,
	},
);

const acceptedAdapter = codecBuilder.buildStrictFieldAdapter<{
	deleted: string | null;
	vip: "Yes" | "No";
}>()({
	deleted: c.nullable.date.and.isoString,
	vip: c.nonNullish.boolean.and.yesNo,
});

// The yesNo side is typed "Yes" | "No" (it was string).
type _yesNoOut = Expect<
	Equal<z.output<typeof c.nonNullish.yesNo.and.boolean>, "Yes" | "No">
>;

describe("encode-direction check", () => {
	test("accepted pairings still work at runtime", () => {
		expect(
			accepted.encode({
				middle_name: null,
				deleted_at: null,
				created_at: new Date(0),
				is_admin: true,
				flag: false,
				label: "",
				touched: new Date(0),
			}),
		).toEqual({
			middle_name: null,
			deleted_at: null,
			created_at: "1970-01-01T00:00:00.000Z",
			is_admin: "Yes",
			flag: "No",
			label: "",
			touched: "1970-01-01T00:00:00.000Z",
		});
		expect(acceptedAdapter.encode({ deleted: null, vip: true })).toEqual({
			deleted: null,
			vip: "Yes",
		});
	});

	test("yesNo codecs still reject other strings", () => {
		expect(
			c.nonNullish.boolean.and.yesNo.safeDecode("maybe").success,
		).toBeFalse();
		expect(c.nonNullish.yesNo.and.boolean.decode(true)).toBe("Yes");
		expect(c.nonNullish.yesNo.and.boolean.encode("No")).toBeFalse();
	});

	test("the rejected pairings are type errors only", () => {
		expect(rejected).toBeFunction();
	});
});
