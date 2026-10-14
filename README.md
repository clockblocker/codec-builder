# codec-builder-library (Zod 3)

> **This is the Zod 3 maintenance line (0.3.x).** It receives critical fixes
> only. New work happens on the Zod 4 line (0.4 and later). If you are on Zod
> 4, use that line instead.

Write one Zod schema, describe how each field should change, and get back a
second schema plus the conversions in both directions.

You keep a single source-of-truth schema, usually the shape you receive from a
database, an API, or a file. Then you pick a codec for each field. Leave it
alone, turn `"12.50"` into `12.5`, turn an ISO string into a `Date`, turn
`undefined` into `null`. The builder derives the other schema from that list and
gives you conversions from source values to the derived shape and back. You
never write the second schema by hand, so it can't drift from the first.

```
  source schema  +  { field: codec, ... }
         │
         ▼
  codec.inputSchema    the schema you wrote               (A)
  codec.outputSchema   the derived schema, built for you  (B)
  codec.fromInput      A ──► B
  codec.fromOutput     B ──► A
```

## Install

```bash
npm install codec-builder-library@^0.3 zod@^3.25
# or
bun add codec-builder-library@^0.3 zod@^3.25
```

`zod` is a peer dependency: `^3.25.0`. Import schemas from `zod` (3.25.x) or
`zod/v3`; they are the same module.

The package root and `codec-builder-library/v3` export the same
`codecBuilder3`. Both entrypoints work with `import` and `require`.

## Quick start

A database row is the source of truth. The application wants real numbers,
booleans, and dates, and it wants `null` instead of a mix of `null` and
`undefined`.

```ts
import { codecBuilder3 } from "codec-builder-library";
import { z } from "zod";

const c = codecBuilder3.fieldCodec;
const h = codecBuilder3.helpers;

const userRow = z.object({
	id: z.number(),
	email: z.string(),
	middle_name: z.string().nullish(),
	is_admin: z.enum(["Yes", "No"]),
	balance: z.string(), // NUMERIC columns arrive as strings
	created_at: z.string().datetime({ offset: true }),
	deleted_at: z.string().datetime({ offset: true }).nullable(),
});

const user = codecBuilder3.buildStrictFieldAdapterCodec(userRow, {
	id: c.noOp,
	email: c.noOp,
	middle_name: c.nullable.string.and.string,
	is_admin: c.nonNullish.boolean.and.yesNo,
	balance: c.nonNullish.number.and.numericString,
	created_at: c.nonNullish.date.and.isoString,
	deleted_at: c.nullable.date.and.isoString,
});
```

You get both types:

```ts
type UserRow = z.input<typeof user.inputSchema>;
// {
//   id: number;
//   email: string;
//   middle_name?: string | null | undefined;
//   is_admin: "Yes" | "No";
//   balance: string;
//   created_at: string;
//   deleted_at: string | null;
// }

type User = z.output<typeof user.outputSchema>;
// {
//   id: number;
//   email: string;
//   middle_name: string | null;
//   is_admin: boolean;
//   balance: number;
//   created_at: Date;
//   deleted_at: Date | null;
// }
```

Both schemas:

```ts
user.inputSchema === userRow; // true, the schema you wrote
user.outputSchema; // z.object({ id, email, middle_name, is_admin, balance, created_at, deleted_at })
```

And both directions:

```ts
const row: UserRow = {
	id: 1,
	email: "ada@example.com",
	is_admin: "Yes",
	balance: "12.50",
	created_at: "2024-01-02T03:04:05.000Z",
	deleted_at: null,
};

const domain: User = user.fromInput(row);
// {
//   id: 1,
//   email: "ada@example.com",
//   middle_name: null,
//   is_admin: true,
//   balance: 12.5,
//   created_at: new Date("2024-01-02T03:04:05.000Z"),
//   deleted_at: null,
// }

user.fromOutput(domain);
// {
//   id: 1,
//   email: "ada@example.com",
//   middle_name: null,
//   is_admin: "Yes",
//   balance: "12.5",
//   created_at: "2024-01-02T03:04:05.000Z",
//   deleted_at: null,
// }
```

`fromInput` and `fromOutput` only convert; they don't validate the whole
object. Parse with the schema on the side you receive:

```ts
const fromDb = user.fromInput(user.inputSchema.parse(row));
user.inputSchema.safeParse({ ...row, created_at: "yesterday" }).success; // false
user.outputSchema.safeParse({ ...fromDb, balance: "12.5" }).success; // false
```

To convert a list, wrap the codec:

```ts
h.toArrayOf(user).fromInput([row])[0]?.created_at; // Date
```

## Building blocks

### `buildStrictFieldAdapterCodec(schema, shape)`

The main builder. `schema` is a `z.object`. `shape` has exactly one entry per
key of the schema, and each entry is one of:

- `fieldCodec.noOp`: keep the field as it is. The derived schema reuses the
  source field's schema.
- a field codec from `fieldCodec` (see the [list below](#field-codecs)), or a
  codec object you write yourself:
  `{ inputSchema, outputSchema, fromInput, fromOutput }` (the exported `Codec`
  type). The derived schema uses the codec's `outputSchema`.
- a nested shape object, for a field whose schema is a `z.object`.
- `fieldCodec.arrayOf(item)`, for a field whose schema is a `z.array`. `item`
  can be `noOp`, a codec, or a nested shape.

```ts
const orderRow = z.object({
	id: z.number(),
	customer: z.object({ name: z.string(), vip: z.enum(["Yes", "No"]) }),
	lines: z.array(z.object({ sku: z.string(), qty: z.string() })),
	discounts: z.array(z.string()),
	total_cents: z.number().int(),
});

const centsToDollars = {
	inputSchema: z.number().int(),
	outputSchema: z.number(),
	fromInput: (cents: number) => cents / 100,
	fromOutput: (dollars: number) => Math.round(dollars * 100),
};

const order = codecBuilder3.buildStrictFieldAdapterCodec(orderRow, {
	id: c.noOp,
	customer: { name: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	lines: c.arrayOf({ sku: c.noOp, qty: c.nonNullish.int.and.numericString }),
	discounts: c.arrayOf(c.nonNullish.number.and.numericString),
	total_cents: centsToDollars,
});

order.fromInput({
	id: 7,
	customer: { name: "Ada", vip: "No" },
	lines: [{ sku: "A-1", qty: "3" }],
	discounts: ["0.5"],
	total_cents: 1999,
});
// {
//   id: 7,
//   customer: { name: "Ada", vip: false },
//   lines: [{ sku: "A-1", qty: 3 }],
//   discounts: [0.5],
//   total_cents: 19.99,
// }
```

"Strict" means the shape is checked against the schema at compile time:

```ts
// @ts-expect-error `customer`, `lines`, `discounts`, `total_cents` are missing
codecBuilder3.buildStrictFieldAdapterCodec(orderRow, {
	id: c.noOp,
});

codecBuilder3.buildStrictFieldAdapterCodec(z.object({ id: z.number() }), {
	// @ts-expect-error this codec converts "Yes" | "No", not a number
	id: c.nonNullish.boolean.and.yesNo,
});
```

A key that isn't in the schema is not a type error, but the builder throws
`Codec shape key "..." is not in schema.` when it runs.

A codec fits a field when the codec's input type accepts the field's type. For
example, `c.nullable.date.and.isoString` takes `string | null | undefined`, so
it fits both `z.string()` and `z.string().nullable()`.

The adapter keeps key names. To rename, group, or split fields, use
`buildReshapeCodec`.

### `buildReshapeCodec(schema, config)`

Adds one field built from the source object and optionally drops the source
fields it replaces. You supply both directions of that one field; the rest of
the object passes through.

```ts
const personRow = z.object({
	id: z.number(),
	first_name: z.string(),
	last_name: z.string(),
});

const person = codecBuilder3.buildReshapeCodec(personRow, {
	fieldName: "name",
	fieldSchema: z.object({ first: z.string(), last: z.string() }),
	dropFields: ["first_name", "last_name"],
	construct: (row) => ({ first: row.first_name, last: row.last_name }),
	reconstruct: (name) => ({ first_name: name.first, last_name: name.last }),
});

type Person = z.output<typeof person.outputSchema>;
// { id: number; name: { first: string; last: string } }

person.fromInput({ id: 1, first_name: "Ada", last_name: "Lovelace" });
// { id: 1, name: { first: "Ada", last: "Lovelace" } }

person.fromOutput({ id: 1, name: { first: "Ada", last: "Lovelace" } });
// { id: 1, first_name: "Ada", last_name: "Lovelace" }
```

`reconstruct` must return every dropped field, and that is enforced by the
types. Pass `dropFields` as an inline array literal: if it's a `string[]`
variable, the fields are still dropped at runtime but the output type keeps
them.

### `buildStrictFieldAdapter<T>()(shape)`

The same shape language for when you have a TypeScript type but no schema. You
get `{ fromInput, fromOutput }` with inferred types. There's no derived schema.

```ts
type ApiUser = { id: number; is_admin: "Yes" | "No"; joined: string };

const adapter = codecBuilder3.buildStrictFieldAdapter<ApiUser>()({
	id: c.noOp,
	is_admin: c.nonNullish.boolean.and.yesNo,
	joined: c.nonNullish.date.and.isoString,
});

adapter.fromInput({ id: 1, is_admin: "No", joined: "2024-01-02" });
// { id: 1, is_admin: false, joined: new Date("2024-01-02") }
```

### Composing

`buildStrictFieldAdapterCodec` and `buildReshapeCodec` both take a `z.object`
and return a codec whose `outputSchema` is a `z.object`. Pass one result's
`outputSchema` to the next builder and join the two with `helpers.pipeCodecs`:

```ts
const contactRow = z.object({
	first_name: z.string(),
	last_name: z.string(),
	vip: z.enum(["Yes", "No"]),
});

const typed = codecBuilder3.buildStrictFieldAdapterCodec(contactRow, {
	first_name: c.noOp,
	last_name: c.noOp,
	vip: c.nonNullish.boolean.and.yesNo,
});

const grouped = codecBuilder3.buildReshapeCodec(typed.outputSchema, {
	fieldName: "name",
	fieldSchema: z.string(),
	dropFields: ["first_name", "last_name"],
	construct: (r) => `${r.first_name} ${r.last_name}`,
	reconstruct: (name) => {
		const [first_name = "", last_name = ""] = name.split(" ");
		return { first_name, last_name };
	},
});

const contact = h.pipeCodecs(typed, grouped);

contact.fromInput({ first_name: "Ada", last_name: "Lovelace", vip: "Yes" });
// { vip: true, name: "Ada Lovelace" }
```

## Field codecs

`codecBuilder3.fieldCodec` is a namespace of ready-made field codecs. Paths read
as `<nullability>.<derived>.and.<source>`, so
`c.nonNullish.number.and.numericString` gives a `number` on the derived side
from a numeric string on the source side.

Type pairs (both directions exist for each):

| Derived   | Source          | `fromInput`                                              |
| --------- | --------------- | -------------------------------------------------------- |
| `number`  | `numericString` | `"12.50"` → `12.5`                                       |
| `int`     | `numericString` | `"12"` → `12`; `"12.7"` throws                           |
| `boolean` | `yesNo`         | `"Yes"` → `true`, `"No"` → `false` (case-sensitive)      |
| `date`    | `isoString`     | ISO date or datetime with offset → `Date`                |

A numeric string is a plain decimal: an optional `+` or `-`, digits, and an
optional fraction (`"12"`, `"-0.5"`, `"+3.25"`). Whitespace, `""`, `"0x1F"`,
`"0b11"`, `"1e3"`, `"Infinity"`, `".5"` and `"5."` are rejected by the schema,
and converting them throws.

The reverse paths (`numericString.and.number`, `numericString.and.int`,
`yesNo.and.boolean`, `isoString.and.date`) go the other way.

Nullability prefixes:

| Prefix                       | Source accepts           | Derived type             | Missing source value  |
| ---------------------------- | ------------------------ | ------------------------ | --------------------- |
| `nonNullish.X.and.Y`         | `Y`                      | `X`                      | rejected              |
| `nonNullish.X.and.nullish.Y` | `Y \| null \| undefined` | `X`                      | replaced by a default |
| `nullable.X.and.Y`           | `Y \| null \| undefined` | `X \| null`              | `null`                |
| `optional.X.and.Y`           | `Y \| undefined`         | `X \| undefined`         | `undefined`           |
| `nullish.X.and.Y`            | `Y \| null \| undefined` | `X \| null \| undefined` | kept as is            |

Defaults for `nonNullish.X.and.nullish.Y`: `0` for `number` and `int`, `"0"` for
`numericString`, `false` for `boolean`, `"No"` for `yesNo`, `""` for `string`,
and the current time for `date` and `isoString`.

A few codecs don't follow the table exactly:

- `nonNullish.date.and.isoString` is the same codec as
  `nonNullish.date.and.nullish.isoString`. It accepts `null`, `undefined`, and
  unparseable strings, and converts all of them to a new `Date` for the current
  time. If a made-up date would be wrong for your data, use
  `nullable.date.and.isoString` and deal with the `null`.
- The `date.and.isoString` codecs under `nullable`, `optional`, and `nullish`
  convert an unparseable string to `null` instead of failing. The `optional`
  one also accepts and returns `null`.
- `nullable.string.and.string` turns `undefined` into `null`.
  `nonNullish.string.and.nullish.string` turns `null` and `undefined` into `""`.
- `nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString` (also
  available under `nullable`) takes
  `(string | null | undefined)[] | null | undefined` and returns `string[]`
  with `null`, `undefined`, and `""` removed. A missing array becomes `[]`.
- `fieldCodec.noOp` keeps a field unchanged, and `fieldCodec.arrayOf` marks an
  array field inside a shape. Neither is a codec on its own.

If none of these fit, write a codec object and use it directly in the shape,
as in the `centsToDollars` example above.

## Helpers

`codecBuilder3.helpers` wraps, combines, or builds codecs. Each one returns a
codec object.

```ts
const numberFromString = c.nonNullish.number.and.numericString;

h.toOptional(numberFromString).fromInput(undefined); // undefined
h.toNullable(numberFromString).fromInput(undefined); // null
h.toNullish(numberFromString).fromInput(null); // null
h.toNonNullishWithDefault(h.toNullable(numberFromString), -1).fromInput(null); // -1
h.toArrayOf(numberFromString).fromInput(["1", "2.5"]); // [1, 2.5]

// Swap the two sides of a codec.
h.reverseCodecDirections(numberFromString).fromInput(2.5); // "2.5"

// Chain two codecs: A → B, then B → C.
const msToDate = {
	inputSchema: z.number(),
	outputSchema: z.date(),
	fromInput: (ms: number) => new Date(ms),
	fromOutput: (date: Date) => date.getTime(),
};
h.pipeCodecs(msToDate, c.nonNullish.isoString.and.date).fromInput(0);
// "1970-01-01T00:00:00.000Z"

// A nullish string becomes one of a fixed set of values, or null.
const status = h.buildNullableUnionAndNullishString(["draft", "published"]);
status.fromInput("draft"); // "draft"
status.fromInput("archived"); // null

// An array with null and undefined items removed. 0, false and "" are kept.
h.buildFilteredNullishArrayCodec(z.number().nullish(), z.number())
	.fromInput([0, null, 1, undefined]); // [0, 1]
```

| Helper                                             | Source side                   | Derived side                                                    |
| -------------------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `toOptional(codec)`                                | `in.optional()`               | `out.optional()`                                                |
| `toNullable(codec)`                                | `in.nullish()`                | `out.nullable()`                                                |
| `toNullish(codec)`                                 | `in.nullish()`                | `out.nullish()`                                                 |
| `toNonNullishWithDefault(codec, default)`          | unchanged                     | `out` unwrapped from `.nullable()`, `null` replaced by `default` |
| `toArrayOf(codec)`                                 | `z.array(in)`                 | `z.array(out)`                                                  |
| `reverseCodecDirections(codec)`                    | `out`                         | `in`                                                            |
| `pipeCodecs(ab, bc)`                               | `ab.in`                       | `bc.out`                                                        |
| `buildNullableUnionAndNullishString(values)`       | `string \| null \| undefined` | `z.enum(values).nullable()`                                     |
| `buildFilteredNullishArrayCodec(inItem, outItem?)` | `z.array(inItem)`             | `z.array(outItem)`                                              |

`in` and `out` stand for `inputSchema` and `outputSchema`.

`toNonNullishWithDefault` expects a codec built by `toNullable` (input
`.nullish()`, output `.nullable()`). The default can be a value or a function
that returns one. A function is called on every conversion, so pass one for
objects, arrays, and dates to give each result its own instance. If the
default is itself a function, wrap it: `() => myFunction`.

```ts
const amounts = h.toNonNullishWithDefault(
	h.toNullable(h.toArrayOf(c.nonNullish.number.and.numericString)),
	() => [],
);
amounts.fromInput(null) !== amounts.fromInput(null); // true, a new array each time
```

## Behavior to know about

- Conversions don't validate. `fromInput` and `fromOutput` only run the field
  conversions. Field codecs that parse a string (numeric strings, ints) throw a
  `ZodError` on invalid input; others pass bad values through. Parse with
  `inputSchema` or `outputSchema` where you need validation.
- A numeric codec converts a number to a string with `String()`, so very large
  or very small numbers (`1e21`, `1e-7`) become exponent strings that the
  numeric string schema rejects.
- The derived object only has the keys in the shape. A field that is optional
  and missing in the source comes back as a key set to `undefined`.
- Derived nested objects are rebuilt with `z.object`, so `strict` or
  `passthrough` on a nested source object is not carried over to
  `outputSchema`. The top-level `outputSchema` is a plain `z.object` too.
- A field whose schema is a nullable or optional object or array can be given a
  nested shape or `arrayOf`, but `null` and `undefined` aren't handled for it.
  A nested shape treats them as an empty object, so its field codecs see
  `undefined` and may throw. `arrayOf` passes them through, but the derived
  schema is a plain `z.array` that rejects them. Use a custom codec for such
  fields.

## Development

```bash
bun install
bun test
bun run typecheck
bun run lint
bun run build
```
