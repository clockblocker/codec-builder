import { describe, expect, test } from "bun:test";
import { Effect, Schema, SchemaGetter } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";

// The snippets of the README's "Effect 4" section, as written there, with
// their comments turned into assertions.

const c = codecBuilder.fieldCodec;

const userRow = Schema.Struct({
	id: Schema.Number,
	email: Schema.String,
	middle_name: Schema.optional(Schema.NullOr(Schema.String)),
	is_admin: Schema.Literals(["Yes", "No"]),
	balance: Schema.String, // NUMERIC columns arrive as strings
	created_at: Schema.String,
	deleted_at: Schema.NullOr(Schema.String),
});

const user = codecBuilder.buildStrictFieldAdapterCodec(userRow, {
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
type _userRow = Expect<Equal<UserRow, typeof userRow.Encoded>>;
type _user = Expect<
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

const row: UserRow = {
	id: 1,
	email: "ada@example.com",
	is_admin: "Yes",
	balance: "12.50",
	created_at: "2024-01-02T03:04:05.000Z",
	deleted_at: null,
};

const centsToDollars = Schema.Int.pipe(
	Schema.decodeTo(Schema.Number, {
		decode: SchemaGetter.transform((cents) => cents / 100),
		encode: SchemaGetter.transform((dollars) => Math.round(dollars * 100)),
	}),
);

const personRow = Schema.Struct({
	id: Schema.Number,
	first_name: Schema.String,
	last_name: Schema.String,
});

const person = codecBuilder.buildReshapeCodec(personRow, {
	fieldName: "name",
	fieldSchema: Schema.Struct({ first: Schema.String, last: Schema.String }),
	dropFields: ["first_name", "last_name"],
	construct: (row) => ({ first: row.first_name, last: row.last_name }),
	reconstruct: (name) => ({ first_name: name.first, last_name: name.last }),
});

type Person = typeof person.Type;
type _person = Expect<
	Equal<
		Person,
		{
			readonly id: number;
			readonly name: { readonly first: string; readonly last: string };
		}
	>
>;

const lemma = Schema.Struct({
	language: Schema.Literal("de"),
	family: Schema.Literals(["Lexeme", "Phraseme"]),
	canonicalForm: Schema.String,
});

const lemmaCodec = codecBuilder.buildFixedFieldsCodec(lemma, {
	language: "de",
	family: "Lexeme",
});

const rejected = () => [
	codecBuilder.buildStrictFieldAdapterCodec(
		Schema.Struct({ flag: Schema.String }),
		{
			// @ts-expect-error a yesNo codec needs a Literals(["Yes", "No"]) field
			flag: c.nonNullish.boolean.and.yesNo,
		},
	),
	codecBuilder.buildStrictFieldAdapterCodec(
		Schema.Struct({ at: Schema.optionalKey(Schema.String) }),
		{
			// @ts-expect-error the key may be missing; this codec needs a value
			at: c.nonNullish.date.and.isoString,
		},
	),
	codecBuilder.buildStrictFieldAdapterCodec(
		Schema.Struct({ at: Schema.String }),
		{
			// @ts-expect-error this codec can leave the key out
			at: c.nullish.date.and.isoString,
		},
	),
];

describe("README: Effect 4", () => {
	test("quick start", () => {
		const domain = Schema.decodeSync(user)(row);
		expect(domain).toEqual({
			...row,
			middle_name: null,
			is_admin: true,
			balance: 12.5,
			created_at: new Date("2024-01-02T03:04:05.000Z"),
			deleted_at: null,
		});
		expect(Schema.encodeSync(user)(domain)).toEqual({
			...row,
			middle_name: null,
			is_admin: "Yes",
			balance: "12.5",
			created_at: "2024-01-02T03:04:05.000Z",
			deleted_at: null,
		});
		expect(
			Schema.decodeUnknownExit(user)({ ...row, created_at: "yesterday" })
				._tag,
		).toBe("Failure");

		const page = Schema.Struct({
			users: Schema.Array(user),
			total: Schema.Number,
		});
		expect(
			Schema.decodeSync(page)({ users: [row], total: 1 }).users[0]
				?.created_at,
		).toBeInstanceOf(Date);
	});

	test("from and to, kept through annotate and check", () => {
		const domain = Schema.decodeSync(user)(row);
		expect(user.from === userRow).toBeTrue();
		expect(Schema.isSchema(user.to)).toBeTrue();
		expect(Schema.is(user.to)(domain)).toBeTrue();
		const checked = user.check(Schema.makeFilter(() => true));
		expect(checked.from).toBe(userRow);
		expect(user.annotate({ title: "User" }).to).toBe(user.to);
	});

	test("a field codec is any Effect schema whose Encoded fits", () => {
		const order = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({ total_cents: Schema.Int }),
			{ total_cents: centsToDollars },
		);
		expect(Schema.decodeSync(order)({ total_cents: 1999 })).toEqual({
			total_cents: 19.99,
		});
	});

	test("buildReshapeCodec", () => {
		expect(person.from).toBe(personRow);
		expect(
			Schema.decodeSync(person)({
				id: 1,
				first_name: "Ada",
				last_name: "Lovelace",
			}),
		).toEqual({ id: 1, name: { first: "Ada", last: "Lovelace" } });
	});

	test("buildFixedFieldsCodec", () => {
		expect(lemmaCodec.to === lemma).toBeTrue();
		expect(
			Schema.decodeSync(lemmaCodec)({ canonicalForm: "Bank" }),
		).toEqual({ language: "de", family: "Lexeme", canonicalForm: "Bank" });
		expect(
			Schema.encodeSync(lemmaCodec)({
				language: "de",
				family: "Lexeme",
				canonicalForm: "Bank",
			}),
		).toEqual({ canonicalForm: "Bank" });
		expect(() =>
			Schema.encodeSync(lemmaCodec)({
				language: "de",
				family: "Phraseme",
				canonicalForm: "Bank",
			}),
		).toThrow(Schema.SchemaError);
	});

	test("differences: async, readonly values, sources", async () => {
		const asyncNumber = Schema.String.pipe(
			Schema.decodeTo(Schema.Number, {
				decode: SchemaGetter.transformEffect((value) =>
					Effect.promise(async () => Number(value)),
				),
				encode: SchemaGetter.transform(String),
			}),
		);
		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({
				n: Schema.String,
				tags: Schema.Array(Schema.String),
			}),
			{ n: asyncNumber, tags: c.noOp },
		);
		type _readonly = Expect<
			Equal<
				typeof codec.Type,
				{ readonly n: number; readonly tags: ReadonlyArray<string> }
			>
		>;
		const input = { n: "1", tags: [] };
		expect(await Schema.decodeUnknownPromise(codec)(input)).toEqual({
			n: 1,
			tags: [],
		});
		expect(
			await Effect.runPromise(Schema.decodeEffect(codec)(input)),
		).toEqual({ n: 1, tags: [] });
		expect(() => Schema.decodeUnknownSync(codec)(input)).toThrow();
		expect("decodeAsync" in codec).toBeFalse();

		expect(() =>
			codecBuilder.buildStrictFieldAdapterCodec(
				Schema.Struct({ a: Schema.String }).check(
					Schema.makeFilter(() => true),
				),
				{ a: c.noOp },
			),
		).toThrow("has checks");
		expect("buildStrictFieldAdapter" in codecBuilder).toBeFalse();
		expect(rejected).toBeFunction();
	});
});
