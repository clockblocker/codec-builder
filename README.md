# codec-builder-library

Write one Zod schema, describe how each field should change, and get back a
second schema plus the conversions in both directions.

You keep a single source-of-truth schema, usually the shape you receive from a
database, an API, or a file. Then you pick a codec for each field. Leave it
alone, turn `"12.50"` into `12.5`, turn an ISO string into a `Date`, turn
`undefined` into `null`. The builder derives the other schema from that list and
gives you one codec that decodes source values into the derived shape and
encodes derived values back. You never write the second schema by hand, so it
can't drift from the first.

```
  source schema  +  { field: codec, ... }
         │
         ▼
  codec.in       the schema you wrote               (A)
  codec.out      the derived schema, built for you  (B)
  codec.decode   A ──► B
  codec.encode   B ──► A
```

The result is a native Zod 4 `z.ZodCodec`, so `decode`, `encode`,
`safeDecode`, `z.decode()`, and nesting inside other schemas all work as usual.
The same builders exist for Effect 4 Schema; see [Effect 4](#effect-4).

## Install

```bash
npm install codec-builder-library zod
# or
bun add codec-builder-library zod
```

`zod` is a peer dependency: `^4.4.0` (the first release with
`z.invertCodec`). Schemas from `zod` and `zod/v4` both work. Zod Mini is not
supported. Zod 3 users: pin `codec-builder-library@^0.3`.

Both peer dependencies are optional, and each entry point needs only its own:
install `zod` for `codec-builder-library` (and `/v4`), and `effect` (`^4.0.0`)
for `codec-builder-library/effect4`.

The package is ESM. `require("codec-builder-library")` works on Node versions
that can `require()` ES modules: 20.19+ or 22.12+.

## Quick start

A database row is the source of truth. The application wants real numbers,
booleans, and dates, and it wants `null` instead of a mix of `null` and
`undefined`.

```ts
import { codecBuilder } from "codec-builder-library";
import { z } from "zod";

const c = codecBuilder.fieldCodec;

const userRow = z.object({
	id: z.number(),
	email: z.string(),
	middle_name: z.string().nullish(),
	is_admin: z.enum(["Yes", "No"]),
	balance: z.string(), // NUMERIC columns arrive as strings
	created_at: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
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
```

You get both types:

```ts
type UserRow = z.input<typeof user>;
// {
//   id: number;
//   email: string;
//   middle_name?: string | null | undefined;
//   is_admin: "Yes" | "No";
//   balance: string;
//   created_at: string;
//   deleted_at: string | null;
// }

type User = z.output<typeof user>;
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
user.in === userRow; // true, the schema you wrote
user.out; // z.object({ id, email, middle_name, is_admin, balance, created_at, deleted_at })
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

const domain = user.decode(row);
// {
//   id: 1,
//   email: "ada@example.com",
//   middle_name: null,
//   is_admin: true,
//   balance: 12.5,
//   created_at: new Date("2024-01-02T03:04:05.000Z"),
//   deleted_at: null,
// }

user.encode(domain);
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

Both directions validate. `decode` checks its input against `user.in` and its
result against `user.out`, and `encode` does the reverse:

```ts
user.safeDecode({ ...row, created_at: "yesterday" }).success; // false
user.safeEncode({ ...domain, balance: "12.5" } as never).success; // false
```

`user` is an ordinary Zod codec, so it can sit inside a bigger schema:

```ts
const page = z.object({ users: z.array(user), total: z.number() });

z.decode(page, { users: [row], total: 1 }).users[0]?.created_at; // Date
```

## Building blocks

All builders live on `codecBuilder`. (`codecBuilder4` and the
`codec-builder-library/v4` subpath are aliases kept from 0.2.)

### `buildStrictFieldAdapterCodec(schema, shape)`

The main builder. `schema` is a `z.object`. `shape` has exactly one entry per
key of the schema, and each entry is one of:

- `fieldCodec.noOp`: keep the field as it is, whatever its type (objects and
  arrays included). The derived schema reuses the source field's schema.
- a field codec from `fieldCodec` (see the [list below](#field-codecs)), or any
  `z.codec(...)` you write yourself. The codec takes the whole field value, so
  an object field can use a codec from `z.object({...})` to a string or a
  class. The derived schema uses the codec's `out`.
  The exported `Codec<Output, Input>` type describes such a codec. A plain
  `.pipe()` or `.transform()` is not a codec (it has no encode direction) and
  is rejected.
- a nested shape object, for a field whose schema is a `z.object` (or a
  nullable/optional one).
- `fieldCodec.arrayOf(item)`, for a field whose schema is a `z.array` (or a
  nullable/optional one). `item` can be `noOp`, a codec, or a nested shape.

```ts
const orderRow = z.object({
	id: z.number(),
	customer: z.object({ name: z.string(), vip: z.enum(["Yes", "No"]) }),
	lines: z.array(z.object({ sku: z.string(), qty: z.string() })),
	discounts: z.array(z.string()),
	total_cents: z.number().int(),
});

const centsToDollars = z.codec(z.number().int(), z.number(), {
	decode: (cents) => cents / 100,
	encode: (dollars) => Math.round(dollars * 100),
});

const order = codecBuilder.buildStrictFieldAdapterCodec(orderRow, {
	id: c.noOp,
	customer: { name: c.noOp, vip: c.nonNullish.boolean.and.yesNo },
	lines: c.arrayOf({ sku: c.noOp, qty: c.nonNullish.int.and.numericString }),
	discounts: c.arrayOf(c.nonNullish.number.and.numericString),
	total_cents: centsToDollars,
});

order.decode({
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
codecBuilder.buildStrictFieldAdapterCodec(orderRow, {
	// type error: `customer`, `lines`, `discounts`, `total_cents` are missing
	id: c.noOp,
});

codecBuilder.buildStrictFieldAdapterCodec(z.object({ id: z.number() }), {
	// type error: this codec decodes a "Yes"/"No" string, not a number
	id: c.nonNullish.boolean.and.yesNo,
});

codecBuilder.buildStrictFieldAdapterCodec(
	z.object({ nick: z.string().optional() }),
	{
		// type error: this codec can encode null, which the field rejects
		nick: c.nullable.string.and.string,
	},
);
```

A key that isn't in the schema is a type error too, at any depth:

```ts
codecBuilder.buildStrictFieldAdapterCodec(z.object({ id: z.number() }), {
	id: c.noOp,
	// type error: Property '"~shape key is not in the schema"' is missing ...
	bogus: c.noOp,
});
```

If the types are bypassed, the builder throws
`Codec shape key "bogus" is not in schema.` when it runs.

A codec fits a field when it fits in both directions: its input type accepts
the field's output type (decode), and whatever it can encode is accepted by
the field (encode). The field's output type is what the source schema
produces, after `.default()`, `.catch()`, `z.preprocess` and `.transform()`:
`z.string().default("x")` fits a codec whose input is `string`, and
`z.string().transform(Number)` needs one whose input is `number`. For example, `c.nullable.date.and.isoString` takes
`string | null | undefined` and encodes `string | null`, so it fits
`z.string().nullable()` and `z.string().nullish()`, but not `z.string()`:
encoding `null` would fail there. Use `c.nonNullish.date.and.isoString` for a
non-nullable field. At runtime the codec still rejects strings that aren't ISO
dates.

The encode side is read from the codec's `in` schema, assuming a codec only
encodes `null` or `undefined` when its `out` side can hold them (the
`nullable.*` codecs take `undefined` but never encode it). A codec with a
wider input than the field, such as `z.union([z.number(), z.string()])` for a
`z.number()` field, is rejected because its type says it may encode a string.

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

const person = codecBuilder.buildReshapeCodec(personRow, {
	fieldName: "name",
	fieldSchema: z.object({ first: z.string(), last: z.string() }),
	dropFields: ["first_name", "last_name"],
	construct: (row) => ({ first: row.first_name, last: row.last_name }),
	reconstruct: (name) => ({ first_name: name.first, last_name: name.last }),
});

type Person = z.output<typeof person>;
// { id: number; name: { first: string; last: string } }

person.decode({ id: 1, first_name: "Ada", last_name: "Lovelace" });
// { id: 1, name: { first: "Ada", last: "Lovelace" } }

person.encode({ id: 1, name: { first: "Ada", last: "Lovelace" } });
// { id: 1, first_name: "Ada", last_name: "Lovelace" }
```

`reconstruct` must return every dropped field, and that is enforced by the
types. Pass `dropFields` as an inline array literal: if it's a `string[]`
variable, the fields are still dropped at runtime but the output type keeps
them.

### `buildFixedFieldsCodec(schema, fixedFields)`

For objects with constant fields that a smaller representation leaves out (for
example, a payload sent to a model that shouldn't have to repeat
`language: "de"`).

The direction is the reverse of the other builders. The schema you pass is the
full, canonical one and becomes `codec.out`. The derived schema, without the
fixed fields, is `codec.in`.

```ts
const lemma = z.strictObject({
	language: z.literal("de"),
	family: z.enum(["Lexeme", "Phraseme"]),
	canonicalForm: z.string(),
});

const lemmaCodec = codecBuilder.buildFixedFieldsCodec(lemma, {
	language: "de",
	family: "Lexeme",
});

lemmaCodec.out === lemma; // true
lemmaCodec.decode({ canonicalForm: "Bank" });
// { language: "de", family: "Lexeme", canonicalForm: "Bank" }
lemmaCodec.encode({ language: "de", family: "Lexeme", canonicalForm: "Bank" });
// { canonicalForm: "Bank" }
```

The fixed values are parsed with the field schemas when the codec is built.
`encode` throws if a canonical value's fixed field differs from the configured
value. The derived schema keeps the canonical object's unknown-key policy
(`strictObject` stays strict).

### `buildStrictFieldAdapter<T>()(shape)`

The same shape language for when you have a TypeScript type but no schema. You
get `{ decode, encode, decodeAsync, encodeAsync }` with inferred types (the
exported `AsyncCodecPair` type). The field codecs validate their own values,
and a failure throws (or rejects with) a `ZodError` with the full path, but
there's no derived schema and nothing checks the fields that use `noOp`.

```ts
type ApiUser = { id: number; is_admin: "Yes" | "No"; joined: string };

const adapter = codecBuilder.buildStrictFieldAdapter<ApiUser>()({
	id: c.noOp,
	is_admin: c.nonNullish.boolean.and.yesNo,
	joined: c.nonNullish.date.and.isoString,
});

adapter.decode({ id: 1, is_admin: "No", joined: "2024-01-02" });
// { id: 1, is_admin: false, joined: new Date("2024-01-02") }
```

### Composing

`buildStrictFieldAdapterCodec` and `buildReshapeCodec` both take a `z.object`
and return a codec whose `out` is a `z.object`. Pass one result's `out` to the
next builder and join the two with `helpers.pipeCodecs`:

```ts
const contactRow = z.object({
	first_name: z.string(),
	last_name: z.string(),
	vip: z.enum(["Yes", "No"]),
});

const typed = codecBuilder.buildStrictFieldAdapterCodec(contactRow, {
	first_name: c.noOp,
	last_name: c.noOp,
	vip: c.nonNullish.boolean.and.yesNo,
});

const grouped = codecBuilder.buildReshapeCodec(typed.out, {
	fieldName: "name",
	fieldSchema: z.string(),
	dropFields: ["first_name", "last_name"],
	construct: (r) => `${r.first_name} ${r.last_name}`,
	reconstruct: (name) => {
		const [first_name = "", last_name = ""] = name.split(" ");
		return { first_name, last_name };
	},
});

const contact = codecBuilder.helpers.pipeCodecs(typed, grouped);

contact.decode({ first_name: "Ada", last_name: "Lovelace", vip: "Yes" });
// { vip: true, name: "Ada Lovelace" }
```

## Field codecs

`codecBuilder.fieldCodec` is a namespace of ready-made field codecs. Paths read
as `<nullability>.<derived>.and.<source>`, so
`c.nonNullish.number.and.numericString` gives a `number` on the derived side
from a numeric string on the source side.

Type pairs (both directions exist for each):

| Derived  | Source          | Decode                                        |
| -------- | --------------- | --------------------------------------------- |
| `number` | `numericString` | `"12.50"` → `12.5`, `"1e3"` → `1000`; rejects `""`, `" 12 "`, `"0x1F"`, `"Infinity"` |
| `int`    | `numericString` | `"12"` → `12`, `"-7"` → `-7`; digits only, so rejects `"12.7"`, `"1e3"`, `"1.0"`, and integers beyond `Number.MAX_SAFE_INTEGER` |
| `boolean`| `yesNo`         | `"Yes"` → `true`, `"No"` → `false` (case-sensitive) |
| `date`   | `isoString`     | ISO date or datetime with offset → `Date`; rejects other strings |

The reverse paths (`numericString.and.number`, `numericString.and.int`,
`yesNo.and.boolean`, `isoString.and.date`) go the other way. The `yesNo`
side's schema is `z.string().pipe(z.enum(["Yes", "No"]))`: it accepts a
`z.string()` source field, and it infers as `"Yes" | "No"`, so it also fits a
`z.enum(["Yes", "No"])` field in the encode direction.

Nullability prefixes:

| Prefix                       | Source accepts          | Derived type            | Missing source value |
| ---------------------------- | ----------------------- | ----------------------- | -------------------- |
| `nonNullish.X.and.Y`         | `Y`                     | `X`                     | rejected             |
| `nonNullish.X.and.nullish.Y` | `Y \| null \| undefined` | `X`                     | replaced by a default |
| `nullable.X.and.Y`           | `Y \| null \| undefined` | `X \| null`             | `null`               |
| `optional.X.and.Y`           | `Y \| undefined`        | `X \| undefined`        | `undefined`          |
| `nullish.X.and.Y`            | `Y \| null \| undefined` | `X \| null \| undefined` | kept as is           |

Defaults for `nonNullish.X.and.nullish.Y`: `0` for `number` and `int`, `"0"` for
`numericString`, `false` for `boolean`, `"No"` for `yesNo`, `""` for `string`,
and the current time for `date` (a new `Date`) and `isoString`
(`new Date().toISOString()`), taken when the value is decoded.

A few codecs don't follow the table exactly:

- `nullable.string.and.string` turns `undefined` into `null`.
  `nonNullish.string.and.nullish.string` turns `null` and `undefined` into `""`.
- `nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString` takes
  `(string | null | undefined)[] | null | undefined` and returns `string[]`
  with `null`, `undefined`, and `""` removed. A missing array becomes `[]`.
  There is no `nullable` variant.
- `fieldCodec.noOp` keeps a field unchanged, and `fieldCodec.arrayOf` marks an
  array field inside a shape. Neither is a codec on its own.

If none of these fit, write a `z.codec` and use it directly in the shape, as in
the `centsToDollars` example above.

## Helpers

`codecBuilder.helpers` wraps, combines, or builds codecs. Each one returns a
`z.ZodCodec`.

```ts
const h = codecBuilder.helpers;
const numberFromString = c.nonNullish.number.and.numericString;

h.toOptional(numberFromString).decode(undefined); // undefined
h.toNullable(numberFromString).decode(undefined); // null
h.toNullish(numberFromString).decode(null); // null
h.toNonNullishWithDefault(h.toNullable(numberFromString), -1).decode(null); // -1
// A function default is called on every decode that needs it.
h.toNonNullishWithDefault(h.toNullable(h.toArrayOf(numberFromString)), () => [])
	.decode(null); // [], a new array each time
h.toArrayOf(numberFromString).decode(["1", "2.5"]); // [1, 2.5]

// Chain two codecs: A → B, then B → C.
const msToDate = z.codec(z.number(), z.date(), {
	decode: (ms) => new Date(ms),
	encode: (date) => date.getTime(),
});
h.pipeCodecs(msToDate, c.nonNullish.isoString.and.date).decode(0);
// "1970-01-01T00:00:00.000Z"

// A nullish string becomes one of a fixed set of values, or null.
const status = h.buildNullableUnionAndNullishString(["draft", "published"]);
status.decode("draft"); // "draft"
status.decode("archived"); // null

// An array with null and undefined items removed on decode.
h.buildFilteredNullishArrayCodec(z.number().nullish(), z.number())
	.decode([0, null, 2, undefined]); // [0, 2]
```

| Helper                                    | Source side            | Derived side    |
| ----------------------------------------- | ---------------------- | --------------- |
| `toOptional(codec)`                       | `in.optional()`        | `out.optional()` |
| `toNullable(codec)`                       | `in.nullish()`         | `out.nullable()` |
| `toNullish(codec)`                        | `in.nullish()`         | `out.nullish()` |
| `toNonNullishWithDefault(codec, default)` | unchanged              | `out` unwrapped from `.nullable()`, `null` replaced by `default` (a value, or a function called per decode) |
| `toArrayOf(codec)`                        | `z.array(in)`          | `z.array(out)`  |
| `pipeCodecs(ab, bc)`                      | `ab.in`                | `bc.out`        |
| `buildNullableUnionAndNullishString(values)` | `string \| null \| undefined` | `z.enum(values).nullable()` |
| `buildFilteredNullishArrayCodec(inItem, outItem?)` | `z.array(inItem)` | `z.array(outItem)`, `null` and `undefined` items dropped |

The wrapping helpers (`toOptional`, `toNullable`, `toNullish`,
`toNonNullishWithDefault`, `toArrayOf`) run the wrapped codec once. Its
failures are ordinary issues (`toArrayOf` puts the item index in the path),
so `safeDecode` returns `{ success: false }`, and async codecs work with the
async methods.

`toNonNullishWithDefault` expects a codec built by `toNullable` (input
`.nullish()`, output `.nullable()`). To default to a function value, wrap it:
`() => myFunction`. To flip a codec's direction, use Zod's own
`z.invertCodec`.

## Why not write `z.codec` by hand?

You can, and this library returns exactly that: a `z.codec(in, out,
{ decode, encode })`. The difference is how much you write and keep in sync.

- With `z.codec` you write both object schemas and both functions. Here you
  write the source schema and one entry per field. The derived schema comes
  from the field codecs (and from the source schema for `noOp` fields), so a
  field added to the source shows up as a type error in the shape until you
  decide what happens to it.
- The shape is checked field by field. A missing key, a key that isn't in the
  schema, or a codec that doesn't fit the field in either direction is a
  compile error.
- Field codecs are reusable values. The same `nullable.date.and.isoString`
  works in every object that has a nullable timestamp, and it already knows its
  own schemas on both sides.

## Behavior to know about

- Order: `decode` parses the input with the source schema first (so
  defaults, `.catch()`, `z.preprocess` and `.transform()` apply), then each
  field codec decodes that field's parsed value, then the result is checked
  against `out`. `encode` checks the value against `out`, runs the field
  codecs' encode, then runs the source schema backward. Zod can't run
  `.transform()` or `z.preprocess` backward, so a source schema that uses them
  decodes fine but `encode` throws `ZodEncodeError`; codecs such as
  `z.stringbool()` work both ways. A `noOp` field over such a source field gets
  an `out` schema for its output side (a pipe's or codec's `out`, or a
  pass-through for a bare `.transform()`), so `out` checks the decoded value
  rather than re-running the source schema on it.
- Field codecs run inside the object codec's transform. If a field codec
  rejects a value that the source schema accepted, the failure is reported
  like any other issue, with its full path (`["balance"]`,
  `["items", 2, "price"]`): `safeDecode`, `safeEncode`, and `safeParse` return
  `{ success: false }`, and `decode`/`encode` throw a `ZodError`. The
  schema-free `buildStrictFieldAdapter` throws a `ZodError` with the same
  paths. `helpers.pipeCodecs` reports failures of either codec the same way.
- Optional keys work like in `z.object`: a key missing from the input stays
  missing in the output, in both directions, and a key that is present stays
  present (even with the value `undefined`). A `noOp`, nested, or `arrayOf`
  field keeps the source key's optionality. A codec field is optional in `out`
  when the codec's `out` schema is optional (`optional.*`, `nullish.*`); a
  codec still runs on a missing value, so `nullable.*` turns a missing key
  into `null` and `nonNullish.X.and.nullish.Y` into its default.
- Field codecs can be async (an async transform or refinement), in nested
  shapes and `arrayOf` too, and so can the codecs given to
  `helpers.pipeCodecs`. Use `decodeAsync`, `encodeAsync`, `safeDecodeAsync`
  or `safeEncodeAsync`; each async step runs once. As in Zod, the sync methods
  throw `$ZodAsyncError` when something async is reached. The schema-free
  `buildStrictFieldAdapter` has `decodeAsync`/`encodeAsync` for the same.
- Each field codec runs once per call: its `in` is checked, it transforms, and
  its `out` is checked by the object's `out` (which contains it). A source
  field that is the codec's own `in` schema is not checked a second time.
- Numeric strings must be decimal numbers with an optional exponent (`"12"`,
  `"-3.5"`, `".5"`, `"1e-7"`) that parse to a finite number. Whitespace, hex,
  binary, octal, `"Infinity"` and `"NaN"` are rejected. The exponent form is
  accepted because `String(1e21)` is `"1e+21"`: whatever `encode` produces
  decodes back to the same number.
- Integer numeric strings are digits with an optional sign (`"42"`, `"-7"`,
  `"+3"`). The `int` codecs reject non-integers (`"1.9"`) instead of rounding,
  reject other spellings of whole numbers (`"1e3"`, `"1.0"`), and reject
  integers outside `±Number.MAX_SAFE_INTEGER`. A safe integer never encodes to
  exponent form, so every encoded value decodes back.
- The date codecs accept an ISO date (`2024-01-02`) or an ISO datetime with
  `Z` or an offset. Any other string fails with a `ZodError`; it is not
  turned into `null` or a default.
- Defaults are taken per decode. A `nonNullish.date.and.nullish.isoString`
  field decoded from `null` gets the time of that decode.
- `out` keeps the unknown-key policy of each source object, top-level and
  nested: `z.strictObject` stays strict, `.passthrough()`/`z.looseObject`
  stays loose, `.catchall(schema)` keeps the catchall, and `.strip()` strips.
  Unknown keys that the source lets through are copied unchanged in both
  directions, and the derived types are the ones Zod infers for that policy
  (for a loose object, `{ ...; [k: string]: unknown }`). The schema-free
  `buildStrictFieldAdapter` has no policy to follow and drops keys outside
  the shape.
- A nested shape or `arrayOf` also fits a nullable or optional object or array
  field. `null` and `undefined` pass through unchanged in both directions, and
  the derived field keeps the same wrappers: `z.object({...}).nullable()`
  becomes `{ street: string } | null` in `out`.

## Effect 4

`codec-builder-library/effect4` has the same builders for Effect 4 Schema:
`buildStrictFieldAdapterCodec`, `buildReshapeCodec` and
`buildFixedFieldsCodec`, the same `fieldCodec` paths, and the helpers
`toOptional`, `toNullable`, `toNullish`, `toNonNullishWithDefault`,
`toArrayOf` and `pipeCodecs`. It doesn't import zod, and the Zod entry points
don't import effect.

```bash
npm install codec-builder-library effect
# or
bun add codec-builder-library effect
```

The source is a `Schema.Struct`, and the result is an ordinary Effect schema:
its `Encoded` is the source's and its `Type` the derived struct, so
`Schema.decodeSync`, `Schema.encodeEffect`, `Schema.decodeUnknownPromise` and
nesting inside other schemas all work as usual.

```ts
import { Schema } from "effect";
import { codecBuilder } from "codec-builder-library/effect4";

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

type UserRow = typeof user.Encoded; // the same type as userRow.Encoded
type User = typeof user.Type;
// {
//   readonly id: number;
//   readonly email: string;
//   readonly middle_name: string | null;
//   readonly is_admin: boolean;
//   readonly balance: number;
//   readonly created_at: Date;
//   readonly deleted_at: Date | null;
// }

const row: UserRow = {
	id: 1,
	email: "ada@example.com",
	is_admin: "Yes",
	balance: "12.50",
	created_at: "2024-01-02T03:04:05.000Z",
	deleted_at: null,
};

const domain = Schema.decodeSync(user)(row);
// { ..., middle_name: null, is_admin: true, balance: 12.5,
//   created_at: new Date("2024-01-02T03:04:05.000Z"), deleted_at: null }

Schema.encodeSync(user)(domain);
// { ..., middle_name: null, is_admin: "Yes", balance: "12.5",
//   created_at: "2024-01-02T03:04:05.000Z", deleted_at: null }

Schema.decodeUnknownExit(user)({ ...row, created_at: "yesterday" })._tag; // "Failure"

const page = Schema.Struct({ users: Schema.Array(user), total: Schema.Number });
Schema.decodeSync(page)({ users: [row], total: 1 }).users[0]?.created_at; // Date
```

`user` is a `Schema.Struct` whose fields are the source fields with each
codec attached by `Schema.decodeTo` (`noOp` keeps the source field). In place
of `in` and `out` it has `from` and `to`, the names `Schema.decodeTo` uses,
and keeps them through `annotate` and `check`:

```ts
user.from === userRow; // true, the schema you wrote
user.to; // the derived Schema.Struct (type side only)
Schema.is(user.to)(domain); // true
```

Nested shapes, `c.arrayOf(...)` and your own codecs work as in the Zod
version. A field codec is any Effect schema whose `Encoded` fits the field,
for example:

```ts
import { Schema, SchemaGetter } from "effect";

const centsToDollars = Schema.Int.pipe(
	Schema.decodeTo(Schema.Number, {
		decode: SchemaGetter.transform((cents) => cents / 100),
		encode: SchemaGetter.transform((dollars) => Math.round(dollars * 100)),
	}),
);
```

`buildReshapeCodec` takes the same config. Its result is
`source.pipe(Schema.decodeTo(derived, ...))`, so `from` is the source and
`to` the derived struct:

```ts
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
// { readonly id: number; readonly name: { readonly first: string; readonly last: string } }

Schema.decodeSync(person)({ id: 1, first_name: "Ada", last_name: "Lovelace" });
// { id: 1, name: { first: "Ada", last: "Lovelace" } }
```

`buildFixedFieldsCodec` keeps the reversed direction: the canonical struct
is the decoded side (`to`), and `from` is the struct without the fixed
fields. Fixed values are written in their encoded form and decoded with
their field schemas when the codec is built. Encoding a value whose fixed
field differs fails with a `SchemaError` at that field's path.

```ts
const lemma = Schema.Struct({
	language: Schema.Literal("de"),
	family: Schema.Literals(["Lexeme", "Phraseme"]),
	canonicalForm: Schema.String,
});

const lemmaCodec = codecBuilder.buildFixedFieldsCodec(lemma, {
	language: "de",
	family: "Lexeme",
});

lemmaCodec.to === lemma; // true
Schema.decodeSync(lemmaCodec)({ canonicalForm: "Bank" });
// { language: "de", family: "Lexeme", canonicalForm: "Bank" }
Schema.encodeSync(lemmaCodec)({
	language: "de",
	family: "Lexeme",
	canonicalForm: "Bank",
});
// { canonicalForm: "Bank" }
```

Differences from the Zod version:

- The `yesNo` side is `Schema.Literals(["Yes", "No"])`, because Effect has
  one `Encoded` type for what a schema accepts and what it encodes. A
  `yesNo` codec needs a `Literals(["Yes", "No"])` source field; on a
  `Schema.String` field it is a type error.
- Optional keys are part of the strictness check. If the source key may be
  missing (`Schema.optional`, `Schema.optionalKey`), the codec must handle a
  missing key, as the `nullable.*`, `optional.*`, `nullish.*` and
  `nonNullish.X.and.nullish.Y` codecs do. If the codec can leave its key out
  (`optional.*`, `nullish.*`), the source key must be optional.
- Async field codecs are Effect transformations (`SchemaGetter.transformEffect`,
  services included), run with `Schema.decodeEffect`/`encodeEffect` or
  `decodeUnknownPromise`/`encodeUnknownPromise`. There are no `decodeAsync`
  methods. The sync APIs throw when they reach an async step.
- Decoded values are readonly, as Effect types them: `readonly` keys and
  `ReadonlyArray`s.
- Sources must be plain `Schema.Struct`s. Index signatures
  (`Schema.StructWithRest`, `Schema.Record`) are not supported, and unknown
  keys follow Effect's `onExcessProperty` parse option.
- A source struct with its own `.check(...)` throws when the codec is built:
  the check runs on the source's decoded value, which the derived struct
  replaces. Check the derived struct instead.
- The schema-free `buildStrictFieldAdapter<T>()` is Zod-only.

## Development

```bash
bun install
bun test           # includes tests/type-budget.test.ts (typeprobe)
bun run typecheck
bun run lint
bun run build
```

`tests/type-budget.test.ts` holds each builder to a type-instantiation budget
and to readable inferred types, using `typeprobe/testing` on the project's
TypeScript. It runs under `bun test`; no separate Node step is needed.

## License

MIT
