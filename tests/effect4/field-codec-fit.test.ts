import { describe, expect, test } from "bun:test";
import { Schema, SchemaGetter } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;
const build = codecBuilder.buildStrictFieldAdapterCodec;

// A codec fits a field when it fits in both directions: it decodes every
// value the field produces (and a missing key, if the key is optional), and
// the field accepts whatever it encodes (and a missing key, if the codec can
// leave the key out).

const nullishToNullable = Schema.NullishOr(Schema.String).pipe(
	Schema.decodeTo(Schema.NullOr(Schema.String), {
		decode: SchemaGetter.transform((value) => value ?? null),
		encode: SchemaGetter.passthrough({ strict: false }),
	}),
);
const numberOrString = Schema.Union([Schema.Number, Schema.String]).pipe(
	Schema.decodeTo(Schema.String, {
		decode: SchemaGetter.transform(String),
		encode: SchemaGetter.transform(Number),
	}),
);

class Address {
	constructor(readonly street: string) {}
}

const addressSchema = Schema.Struct({ street: Schema.String });
const addressToClass = addressSchema.pipe(
	Schema.decodeTo(Schema.instanceOf(Address), {
		decode: SchemaGetter.transform((value) => new Address(value.street)),
		encode: SchemaGetter.transform((address) => ({
			street: address.street,
		})),
	}),
);
const addressToString = addressSchema.pipe(
	Schema.decodeTo(Schema.String, {
		decode: SchemaGetter.transform((value) => value.street),
		encode: SchemaGetter.transform((street) => ({ street })),
	}),
);

const rejected = () => [
	build(Schema.Struct({ nick: Schema.optional(Schema.String) }), {
		// @ts-expect-error encodes null, which an optional string rejects
		nick: c.nullable.string.and.string,
	}),
	build(Schema.Struct({ nick: Schema.optional(Schema.String) }), {
		// @ts-expect-error a custom codec whose encode returns string | null
		nick: nullishToNullable,
	}),
	build(Schema.Struct({ id: Schema.Number }), {
		// @ts-expect-error may encode a string into a number field
		id: numberOrString,
	}),
	build(Schema.Struct({ born: Schema.String }), {
		// @ts-expect-error encodes null, which a non-nullable string rejects
		born: c.nullable.date.and.isoString,
	}),
	build(Schema.Struct({ born: Schema.String }), {
		// @ts-expect-error can leave the key out (or encode undefined)
		born: c.optional.date.and.isoString,
	}),
	build(Schema.Struct({ born: Schema.optionalKey(Schema.String) }), {
		// @ts-expect-error needs a value, but the key may be missing
		born: c.nonNullish.date.and.isoString,
	}),
	build(Schema.Struct({ born: Schema.String }), {
		// @ts-expect-error an exact optional key can be left out on encode
		born: Schema.optionalKey(c.nonNullish.date.and.isoString),
	}),
	build(
		Schema.Struct({
			profile: Schema.Struct({ nick: Schema.optional(Schema.String) }),
		}),
		{
			// @ts-expect-error nested fields are checked too
			profile: { nick: c.nullable.string.and.string },
		},
	),
	build(Schema.Struct({ tags: Schema.Array(Schema.String) }), {
		// @ts-expect-error array items are checked too
		tags: c.arrayOf(c.nullable.string.and.string),
	}),
	build(Schema.Struct({ flag: Schema.String }), {
		// @ts-expect-error the yesNo side takes "Yes" | "No", not any string
		flag: c.nonNullish.boolean.and.yesNo,
	}),
	build(Schema.Struct({ work: Schema.NullOr(addressSchema) }), {
		// @ts-expect-error a non-nullable codec cannot decode a nullable field
		work: addressToClass,
	}),
	build(Schema.Struct({ home: addressSchema }), {
		// @ts-expect-error encodes null, which the non-nullable field rejects
		home: h.toNullable(addressToString),
	}),
	build(Schema.Struct({ home: addressSchema }), {
		// @ts-expect-error the codec's input struct has a different shape
		home: Schema.Struct({ street: Schema.Number }).pipe(
			Schema.decodeTo(Schema.String, {
				decode: SchemaGetter.transform(String),
				encode: SchemaGetter.transform(() => ({ street: 0 })),
			}),
		),
	}),
	build(Schema.Struct({ len: Schema.NumberFromString }), {
		// @ts-expect-error the codec gets the decoded number, not a string
		len: c.nonNullish.number.and.numericString,
	}),
];

const accepted = build(
	Schema.Struct({
		middle_name: Schema.optional(Schema.NullOr(Schema.String)),
		deleted_at: Schema.NullOr(Schema.String),
		created_at: Schema.String,
		is_admin: Schema.Literals(["Yes", "No"]),
		label: Schema.String,
		touched: Schema.String,
		maybe: Schema.optional(Schema.String),
		missing: Schema.optionalKey(Schema.String),
	}),
	{
		middle_name: c.nullable.string.and.string,
		deleted_at: c.nullable.date.and.isoString,
		created_at: c.nonNullish.date.and.isoString,
		is_admin: c.nonNullish.boolean.and.yesNo,
		label: c.nonNullish.string.and.nullish.string,
		touched: c.nonNullish.date.and.nullish.isoString,
		maybe: c.optional.date.and.isoString,
		missing: Schema.optionalKey(c.nonNullish.date.and.isoString),
	},
);

const objects = build(
	Schema.Struct({
		home: addressSchema,
		work: Schema.NullOr(addressSchema),
		billing: Schema.optional(addressSchema),
		meta: Schema.Struct({ a: Schema.Number }),
	}),
	{
		home: addressToString,
		work: h.toNullable(addressToClass),
		billing: h.toOptional(addressToString),
		meta: c.noOp,
	},
);

type _objects = Expect<
	Equal<
		typeof objects.Type,
		{
			readonly home: string;
			readonly work: Address | null;
			readonly billing?: string | undefined;
			readonly meta: { readonly a: number };
		}
	>
>;

// The yesNo side is typed "Yes" | "No".
type _yesNo = Expect<
	Equal<typeof c.nonNullish.yesNo.and.boolean.Type, "Yes" | "No">
>;

describe("codec fit", () => {
	test("accepted pairings work at runtime", () => {
		const domain = {
			middle_name: null,
			deleted_at: null,
			created_at: new Date(0),
			is_admin: true,
			label: "",
			touched: new Date(0),
		};
		expect(Schema.encodeSync(accepted)(domain)).toEqual({
			middle_name: null,
			deleted_at: null,
			created_at: "1970-01-01T00:00:00.000Z",
			is_admin: "Yes",
			label: "",
			touched: "1970-01-01T00:00:00.000Z",
		});
		expect(
			Schema.decodeSync(accepted)({
				deleted_at: null,
				created_at: "1970-01-01T00:00:00.000Z",
				is_admin: "No",
				label: "x",
				touched: "1970-01-01T00:00:00.000Z",
			}),
		).toEqual({
			middle_name: null,
			deleted_at: null,
			created_at: new Date(0),
			is_admin: false,
			label: "x",
			touched: new Date(0),
		});
	});

	test("codecs on struct fields, including nullable and optional ones", () => {
		const input = {
			home: { street: "Main" },
			work: { street: "Side" },
			billing: { street: "Bill" },
			meta: { a: 1 },
		};
		const decoded = Schema.decodeSync(objects)(input);
		expect(decoded.home).toBe("Main");
		expect(decoded.work).toBeInstanceOf(Address);
		expect(decoded.billing).toBe("Bill");
		expect(Schema.encodeSync(objects)(decoded)).toEqual(input);
		expect(
			Schema.decodeSync(objects)({
				home: { street: "Main" },
				work: null,
				meta: { a: 1 },
			}),
		).toEqual({ home: "Main", work: null, meta: { a: 1 } });
	});

	test("the rejected pairings are type errors only", () => {
		expect(rejected).toBeFunction();
	});
});
