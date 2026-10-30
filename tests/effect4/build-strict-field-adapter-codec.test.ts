import { describe, expect, test } from "bun:test";
import { Schema, SchemaGetter } from "effect";
import {
	codecBuilder,
	type ShapeOfStrictFieldAdapterCodec,
} from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";
import { decodeIssues, encodeIssues, paths } from "./issues";

const c = codecBuilder.fieldCodec;
const build = codecBuilder.buildStrictFieldAdapterCodec;

// -- The README quick start --

const userRow = Schema.Struct({
	id: Schema.Number,
	email: Schema.String,
	middle_name: Schema.optional(Schema.NullOr(Schema.String)),
	is_admin: Schema.Literals(["Yes", "No"]),
	balance: Schema.String, // NUMERIC columns arrive as strings
	created_at: Schema.String,
	deleted_at: Schema.NullOr(Schema.String),
});

const user = build(userRow, {
	id: c.noOp,
	email: c.noOp,
	middle_name: c.nullable.string.and.string,
	is_admin: c.nonNullish.boolean.and.yesNo,
	balance: c.nonNullish.number.and.numericString,
	created_at: c.nonNullish.date.and.isoString,
	deleted_at: c.nullable.date.and.isoString,
});

type UserRow = typeof user.Encoded;
type User = typeof user.Type;

type _encoded = Expect<
	Equal<
		UserRow,
		{
			readonly id: number;
			readonly email: string;
			readonly middle_name?: string | null | undefined;
			readonly is_admin: "Yes" | "No";
			readonly balance: string;
			readonly created_at: string;
			readonly deleted_at: string | null;
		}
	>
>;
type _encodedIsSource = Expect<Equal<UserRow, typeof userRow.Encoded>>;
type _type = Expect<
	Equal<
		User,
		{
			readonly id: number;
			readonly email: string;
			readonly middle_name: string | null;
			readonly is_admin: boolean;
			readonly balance: number;
			readonly created_at: Date;
			readonly deleted_at: Date | null;
		}
	>
>;
type _from = Expect<Equal<typeof user.from, typeof userRow>>;
type _to = Expect<Equal<typeof user.to.Type, User>>;
type _services = Expect<Equal<typeof user.DecodingServices, never>>;

const row: UserRow = {
	id: 1,
	email: "ada@example.com",
	is_admin: "Yes",
	balance: "12.50",
	created_at: "2024-01-02T03:04:05.000Z",
	deleted_at: null,
};

const domain: User = {
	id: 1,
	email: "ada@example.com",
	middle_name: null,
	is_admin: true,
	balance: 12.5,
	created_at: new Date("2024-01-02T03:04:05.000Z"),
	deleted_at: null,
};

// -- Nested shapes, arrayOf and custom codecs --

const orderRow = Schema.Struct({
	id: Schema.Number,
	customer: Schema.Struct({
		name: Schema.String,
		vip: Schema.Literals(["Yes", "No"]),
	}),
	lines: Schema.Array(
		Schema.Struct({ sku: Schema.String, qty: Schema.String }),
	),
	discounts: Schema.Array(Schema.String),
	total_cents: Schema.Int,
});

const centsToDollars = Schema.Int.pipe(
	Schema.decodeTo(Schema.Number, {
		decode: SchemaGetter.transform((cents) => cents / 100),
		encode: SchemaGetter.transform((dollars) => Math.round(dollars * 100)),
	}),
);

const order = build(orderRow, {
	id: c.noOp,
	customer: { name: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	lines: c.arrayOf({ sku: c.noOp, qty: c.nonNullish.int.and.numericString }),
	discounts: c.arrayOf(c.nonNullish.number.and.numericString),
	total_cents: centsToDollars,
});

type _order = Expect<
	Equal<
		typeof order.Type,
		{
			readonly id: number;
			readonly customer: { readonly name: string; readonly vip: boolean };
			readonly lines: ReadonlyArray<{
				readonly sku: string;
				readonly qty: number;
			}>;
			readonly discounts: ReadonlyArray<number>;
			readonly total_cents: number;
		}
	>
>;
type _orderEncoded = Expect<
	Equal<typeof order.Encoded, typeof orderRow.Encoded>
>;

// -- Strictness: compile errors --

const strict = Schema.Struct({ id: Schema.Number });
const strictNested = Schema.Struct({
	a: Schema.Struct({ b: Schema.Number, c: Schema.String }),
});

const rejected = () => [
	// @ts-expect-error `customer`, `lines`, `discounts`, `total_cents` are missing
	build(orderRow, { id: c.noOp }),
	build(strict, {
		// @ts-expect-error this codec decodes "Yes"/"No", not a number
		id: c.nonNullish.boolean.and.yesNo,
	}),
	build(Schema.Struct({ nick: Schema.optional(Schema.String) }), {
		// @ts-expect-error this codec can encode null, which the field rejects
		nick: c.nullable.string.and.string,
	}),
	build(strict, {
		id: c.noOp,
		// @ts-expect-error a key that isn't in the schema
		bogus: c.noOp,
	}),
	build(strictNested, {
		a: {
			b: c.noOp,
			c: c.noOp,
			// @ts-expect-error unknown keys are rejected at any depth
			packed: c.noOp,
		},
	}),
	build(strict, {
		// @ts-expect-error a scalar field cannot take an array shape
		id: c.arrayOf(c.noOp),
	}),
	build(Schema.Struct({ dates: Schema.Array(Schema.Number) }), {
		// @ts-expect-error array items are checked too
		dates: c.arrayOf(c.nonNullish.boolean.and.yesNo),
	}),
];

const answerItem = Schema.Struct({
	ans_to_q2: Schema.String,
	comment_to_q2_: Schema.String,
});

const answerItemShape = {
	ans_to_q2: c.noOp,
	comment_to_q2_: c.noOp,
} satisfies ShapeOfStrictFieldAdapterCodec<typeof answerItem>;

const answerItemShapeWithWrongKey = {
	ans_to_q2: c.noOp,
	comment_to_q2_: c.noOp,
	// @ts-expect-error typo key should be rejected at declaration site
	comment_to_q2: c.noOp,
} satisfies ShapeOfStrictFieldAdapterCodec<typeof answerItem>;

// -- Tests --

describe("buildStrictFieldAdapterCodec (Effect 4)", () => {
	test("decodes and encodes with Effect's own APIs", () => {
		expect(Schema.decodeSync(user)(row)).toEqual(domain);
		expect(Schema.encodeSync(user)(domain)).toEqual({
			...row,
			middle_name: null,
			balance: "12.5",
		});
	});

	test("from is the source schema and to the derived one", () => {
		expect(user.from).toBe(userRow);
		expect(Schema.decodeUnknownSync(user.to)(domain)).toEqual(domain);
		expect(Schema.is(user.to)(domain)).toBeTrue();
		expect(Schema.is(user.to)({ ...domain, balance: "12.5" })).toBeFalse();
		expect(Object.keys(user.fields)).toEqual(Object.keys(userRow.fields));
	});

	test("the result is a schema that stays one when annotated", () => {
		expect(Schema.isSchema(user)).toBeTrue();
		const annotated = user.annotate({ title: "User" });
		expect(annotated.from).toBe(userRow);
		expect(annotated.to).toBe(user.to);
		expect(Schema.decodeSync(annotated)(row)).toEqual(domain);
	});

	test("both directions validate", () => {
		expect(
			paths(decodeIssues(user, { ...row, created_at: "yesterday" })),
		).toEqual([["created_at"]]);
		expect(
			paths(encodeIssues(user, { ...domain, balance: "12.5" })),
		).toEqual([["balance"]]);
		expect(() =>
			Schema.decodeUnknownSync(user)({ ...row, id: "1" }),
		).toThrow(Schema.SchemaError);
	});

	test("nests inside a bigger schema", () => {
		const page = Schema.Struct({
			users: Schema.Array(user),
			total: Schema.Number,
		});
		const decoded = Schema.decodeSync(page)({ users: [row], total: 1 });
		expect(decoded.users[0]?.created_at).toEqual(domain.created_at);
		expect(Schema.encodeSync(page)(decoded)).toEqual({
			users: [{ ...row, middle_name: null, balance: "12.5" }],
			total: 1,
		});
	});

	test("nested shapes, arrayOf and custom codecs", () => {
		const input = {
			id: 7,
			customer: { name: "Ada", vip: "No" as const },
			lines: [{ sku: "A-1", qty: "3" }],
			discounts: ["0.5"],
			total_cents: 1999,
		};
		const decoded = Schema.decodeSync(order)(input);
		expect(decoded).toEqual({
			id: 7,
			customer: { name: "Ada", vip: false },
			lines: [{ sku: "A-1", qty: 3 }],
			discounts: [0.5],
			total_cents: 19.99,
		});
		expect(Schema.encodeSync(order)(decoded)).toEqual(input);
		expect(order.fields.customer.from).toBe(orderRow.fields.customer);
		expect(
			paths(
				decodeIssues(order, {
					...input,
					lines: [
						{ sku: "A-1", qty: "3" },
						{ sku: "B", qty: "1.5" },
					],
				}),
			),
		).toEqual([["lines", 1, "qty"]]);
	});

	test("any Effect schema is a field codec", () => {
		const codec = build(strict, {
			id: Schema.NumberFromString.pipe(Schema.flip),
		});
		expect(Schema.decodeSync(codec)({ id: 42 })).toEqual({ id: "42" });
		expect(Schema.encodeSync(codec)({ id: "42" })).toEqual({ id: 42 });
	});

	test("noOp keeps a transforming source field as it is", () => {
		const codec = build(Schema.Struct({ n: Schema.NumberFromString }), {
			n: c.noOp,
		});
		expect(codec.fields.n).toBe(Schema.NumberFromString);
		expect(Schema.decodeSync(codec)({ n: "2" })).toEqual({ n: 2 });
		expect(Schema.encodeSync(codec)({ n: 2 })).toEqual({ n: "2" });
		expect(Schema.is(codec.to)({ n: 2 })).toBeTrue();
		expect(Schema.is(codec.to)({ n: "2" })).toBeFalse();
	});

	test("a codec gets the source field's decoded value", () => {
		const codec = build(Schema.Struct({ n: Schema.NumberFromString }), {
			n: c.nonNullish.numericString.and.number,
		});
		type _n = Expect<Equal<typeof codec.Type, { readonly n: string }>>;
		expect(Schema.decodeSync(codec)({ n: "1e3" })).toEqual({ n: "1000" });
		expect(Schema.encodeSync(codec)({ n: "1000" })).toEqual({ n: "1000" });
	});

	test("throws for shapes that bypass the types", () => {
		expect(() =>
			build(strictNested, {
				a: { b: c.noOp, c: c.noOp, packed: c.noOp },
			} as never),
		).toThrow('Codec shape key "packed" is not in schema.');
		expect(() => build(strict, { id: c.arrayOf(c.noOp) } as never)).toThrow(
			"Codec shape expects an array schema.",
		);
		expect(() =>
			build(strictNested, { a: c.noOp, b: c.noOp } as never),
		).toThrow('Codec shape key "b" is not in schema.');
		expect(() => build(strictNested, {} as never)).toThrow(
			'Codec shape is missing schema key "a".',
		);
		expect(() => build(strict, { id: { x: c.noOp } } as never)).toThrow(
			"Codec shape does not match nested object schema.",
		);
	});

	test("rejects a source struct with checks, which it could not keep", () => {
		const checked = Schema.Struct({ a: Schema.String }).check(
			Schema.makeFilter(() => true),
		);
		expect(() => build(checked, { a: c.noOp })).toThrow("has checks");
	});

	test("the rejected shapes are type errors only", () => {
		expect(rejected).toBeFunction();
		expect(answerItemShape).toBeDefined();
		expect(answerItemShapeWithWrongKey).toBeDefined();
	});
});
