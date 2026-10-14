// Declarations measured by tests/type-budget.test.ts. Keep them small and
// representative: each one exercises one builder the way a consumer would.
import { z } from "zod/v4";
import { codecBuilder } from "../../src";

const c = codecBuilder.fieldCodec;

const userRow = z.object({
	id: z.number(),
	email: z.string(),
	middle_name: z.string().nullish(),
	is_admin: z.enum(["Yes", "No"]),
	balance: z.string(),
	created_at: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
	customer: z.object({ name: z.string(), vip: z.enum(["Yes", "No"]) }),
	lines: z.array(z.object({ sku: z.string(), qty: z.string() })),
	discounts: z.array(z.string()),
});

export const userCodec = codecBuilder.buildStrictFieldAdapterCodec(userRow, {
	id: c.noOp,
	email: c.noOp,
	middle_name: c.nullable.string.and.string,
	is_admin: c.nonNullish.boolean.and.yesNo,
	balance: c.nonNullish.number.and.numericString,
	created_at: c.nonNullish.date.and.isoString,
	deleted_at: c.nullable.date.and.isoString,
	customer: { name: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	lines: c.arrayOf({ sku: c.noOp, qty: c.nonNullish.int.and.numericString }),
	discounts: c.arrayOf(c.nonNullish.number.and.numericString),
});
export type User = z.output<typeof userCodec>;

type ApiUser = {
	id: number;
	is_admin: "Yes" | "No";
	joined: string;
	tags: string[];
	profile: { nick: string; age: string };
};

export const apiUserAdapter = codecBuilder.buildStrictFieldAdapter<ApiUser>()({
	id: c.noOp,
	is_admin: c.nonNullish.boolean.and.yesNo,
	joined: c.nonNullish.date.and.isoString,
	tags: c.arrayOf(c.noOp),
	profile: { nick: c.noOp, age: c.nonNullish.number.and.numericString },
});
export type AdaptedApiUser = ReturnType<typeof apiUserAdapter.decode>;

const personRow = z.object({
	id: z.number(),
	first_name: z.string(),
	last_name: z.string(),
});

export const personCodec = codecBuilder.buildReshapeCodec(personRow, {
	fieldName: "name",
	fieldSchema: z.object({ first: z.string(), last: z.string() }),
	dropFields: ["first_name", "last_name"],
	construct: (row) => ({ first: row.first_name, last: row.last_name }),
	reconstruct: (name) => ({ first_name: name.first, last_name: name.last }),
});
export type Person = z.output<typeof personCodec>;

const lemma = z.strictObject({
	language: z.literal("de"),
	family: z.enum(["Lexeme", "Phraseme"]),
	canonicalForm: z.string(),
});

export const lemmaCodec = codecBuilder.buildFixedFieldsCodec(lemma, {
	language: "de",
	family: "Lexeme",
});
export type CompactLemma = z.input<typeof lemmaCodec>;
