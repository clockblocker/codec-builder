// Declarations measured by tests/effect4/type-budget.test.ts. Keep them
// small and representative: each one exercises one builder the way a
// consumer would.
import { Schema } from "effect";
import { codecBuilder } from "../../src/effect4";

const c = codecBuilder.fieldCodec;

const userRow = Schema.Struct({
	id: Schema.Number,
	email: Schema.String,
	middle_name: Schema.optional(Schema.NullOr(Schema.String)),
	is_admin: Schema.Literals(["Yes", "No"]),
	balance: Schema.String,
	created_at: Schema.String,
	deleted_at: Schema.NullOr(Schema.String),
	customer: Schema.Struct({
		name: Schema.String,
		vip: Schema.Literals(["Yes", "No"]),
	}),
	lines: Schema.Array(
		Schema.Struct({ sku: Schema.String, qty: Schema.String }),
	),
	discounts: Schema.Array(Schema.String),
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
export type User = typeof userCodec.Type;
export type UserRow = typeof userCodec.Encoded;

const personRow = Schema.Struct({
	id: Schema.Number,
	first_name: Schema.String,
	last_name: Schema.String,
});

export const personCodec = codecBuilder.buildReshapeCodec(personRow, {
	fieldName: "name",
	fieldSchema: Schema.Struct({ first: Schema.String, last: Schema.String }),
	dropFields: ["first_name", "last_name"],
	construct: (row) => ({ first: row.first_name, last: row.last_name }),
	reconstruct: (name) => ({ first_name: name.first, last_name: name.last }),
});
export type Person = typeof personCodec.Type;
