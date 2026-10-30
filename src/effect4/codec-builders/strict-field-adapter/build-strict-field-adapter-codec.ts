import { Schema, type SchemaAST } from "effect";
import {
	isArraySchema,
	isStructSchema,
	rewrap,
	unwrapNullish,
} from "../../core/schema-shapes.js";
import type { AnyStruct, NoOpCodec } from "../../core/types.js";

// -- Exports --

export const noOpCodec = { __noOpCodec: true } as const satisfies NoOpCodec;

/**
 * The shape `buildStrictFieldAdapterCodec` takes for `TSource`, for
 * declaring one on its own: `{...} satisfies ShapeOfStrictFieldAdapterCodec<
 * typeof row>`.
 */
export type ShapeOfStrictFieldAdapterCodec<TSource extends AnyStruct> =
	CodecShapeForFields<TSource["fields"]>;

/**
 * What `buildStrictFieldAdapterCodec` returns: a `Schema.Struct` whose fields
 * decode the source fields into the derived ones, so its `Encoded` is the
 * source's and its `Type` the derived struct. `from` is the source schema and
 * `to` the derived one (type side only), named like `Schema.decodeTo`'s.
 */
export interface StrictFieldAdapterCodec<
	TSource extends Schema.Constraint,
	TFields extends Schema.Struct.Fields,
> extends Schema.Struct<TFields> {
	readonly Rebuild: StrictFieldAdapterCodec<TSource, TFields>;
	readonly from: TSource;
	readonly to: Schema.Struct<TypeSideFields<TFields>>;
}

export function arrayOfCodecShapes<
	const TItemShape extends RuntimeArrayItemShape,
>(itemShape: TItemShape): ArrayCodecShape<TItemShape> {
	return { __arrayCodecShape: true, itemShape };
}

export function buildStrictFieldAdapterCodec<
	TSource extends AnyStruct,
	const S extends CodecShapeForFields<TSource["fields"]>,
>(
	source: TSource,
	shape: S & NoInfer<CodecShapeChecks<TSource["fields"], S>>,
): StrictFieldAdapterCodec<TSource, ComposedFields<TSource["fields"], S>> {
	// Built with plain types and cast once, like the Zod builder.
	return compileStruct(source, shape as RuntimeCodecShape, "") as never;
}

// -- Internals --

type Fields = Schema.Struct.Fields;
type AnyCodec = Schema.Constraint;
type RuntimeCodecShape = Record<string, unknown>;
type RuntimeArrayItemShape = RuntimeCodecShape | AnyCodec | NoOpCodec;

interface ArrayCodecShape<TItemShape = unknown> {
	readonly __arrayCodecShape: true;
	readonly itemShape: TItemShape;
}

type TypeSideFields<F extends Fields> = {
	readonly [K in keyof F]: Schema.toType<F[K]>;
};

// -- Reading field schemas --
//
// A field's schema may wrap a struct or an array in `optionalKey`/`optional`
// and in `NullOr`/`UndefinedOr`/`NullishOr`. These read through the
// wrappers, and RewrapLike puts a new inner schema back inside them.

type NonNullishMembers<M extends ReadonlyArray<AnyCodec>> = {
	[K in keyof M]: M[K]["Type"] extends null | undefined ? never : M[K];
}[number];

type OptionalKeyField = {
	readonly "~type.optionality": "optional";
	readonly schema: AnyCodec;
};

type UnwrapNullish<TField> = TField extends OptionalKeyField
	? UnwrapNullish<TField["schema"]>
	: TField extends {
				readonly ast: SchemaAST.Union;
				readonly members: infer M extends ReadonlyArray<AnyCodec>;
			}
		? UnwrapNullish<NonNullishMembers<M>>
		: TField;

type StructOf<TField> =
	UnwrapNullish<TField> extends infer TInner extends AnyCodec & {
		readonly ast: SchemaAST.Objects;
		readonly fields: Fields;
	}
		? TInner
		: never;

type StructFieldsOf<TField> = StructOf<TField>["fields"];

type ArrayItemOf<TField> =
	UnwrapNullish<TField> extends {
		readonly ast: SchemaAST.Arrays;
		readonly value: infer TItem extends AnyCodec;
	}
		? TItem
		: never;

type RewrapLike<TField, TInner extends AnyCodec> =
	TField extends Schema.optional<infer TWrapped>
		? Schema.optional<RewrapLike<TWrapped, TInner>>
		: TField extends Schema.optionalKey<infer TWrapped>
			? Schema.optionalKey<RewrapLike<TWrapped, TInner>>
			: TField extends Schema.NullishOr<infer TWrapped>
				? Schema.NullishOr<RewrapLike<TWrapped, TInner>>
				: TField extends Schema.NullOr<infer TWrapped>
					? Schema.NullOr<RewrapLike<TWrapped, TInner>>
					: TField extends Schema.UndefinedOr<infer TWrapped>
						? Schema.UndefinedOr<RewrapLike<TWrapped, TInner>>
						: TInner;

// -- The shape --
//
// The constraint on S says what each key may hold: noOp, any schema (a
// field codec), and for struct and array fields a nested shape or arrayOf.
// Whether a codec fits its field is checked by CodecShapeChecks below.

type CodecShapeForFields<F extends Fields> = {
	readonly [K in keyof F]: CodecShapeNodeForField<F[K]>;
};

type NestedShapeForField<TField> = [StructFieldsOf<TField>] extends [never]
	? never
	: CodecShapeForFields<StructFieldsOf<TField>>;

type CodecShapeNodeForField<TField> =
	| NoOpCodec
	| AnyCodec
	| NestedShapeForField<TField>
	| ([ArrayItemOf<TField>] extends [never]
			? never
			: ArrayCodecShape<
					| NoOpCodec
					| AnyCodec
					| NestedShapeForField<ArrayItemOf<TField>>
				>);

// -- Shape checks --
//
// Applied as `shape: S & NoInfer<Checks>`. A passing node maps to `unknown`;
// a failing one maps to an interface the node lacks, so the error lands on
// that key and says what is wrong:
// - decode: the codec accepts every value the field produces, and if the
//   key may be missing, the codec handles a missing key (its encoded side is
//   an optional key, like `nullable.*` and `optional.*`);
// - encode: whatever the codec can encode is accepted by the field, and if
//   the codec can leave the key out, the field's key is optional;
// - keys that are not in the schema.

/** Field values the codec does not accept. */
interface DecodeMismatch<TRejected> {
	readonly "~codec cannot decode these field values": TRejected;
}

/** Values the codec may encode that the field does not accept. */
interface EncodeMismatch<TRejected> {
	readonly "~codec can encode values the field does not accept": TRejected;
}

interface MissingKeyMismatch {
	readonly "~codec needs a value but the field's key may be missing": true;
}

interface OmittedKeyMismatch {
	readonly "~codec can leave out the key, which the field requires": true;
}

/** A shape key that the schema does not have. */
interface UnknownShapeKey<TKey> {
	readonly "~shape key is not in the schema": TKey;
}

type NullishNotIn<T> =
	| (null extends T ? never : null)
	| (undefined extends T ? never : undefined);

// Encode produces the codec's Encoded type. Codecs map null to null and
// undefined to undefined, so a nullish value the Type side cannot hold is
// assumed not to come back out (`nullable.*` codecs take
// `string | null | undefined` but encode only `string | null`).
type EncodeOutputOf<TCodec extends AnyCodec> = Exclude<
	TCodec["Encoded"],
	NullishNotIn<TCodec["Type"]>
>;

type IsOptionalKey<
	TSchema extends AnyCodec,
	TSide extends "~type.optionality" | "~encoded.optionality",
> = TSchema[TSide] extends "optional" ? true : false;

type DecodeCheck<TField extends AnyCodec, TCodec extends AnyCodec> = [
	TField["Type"],
] extends [TCodec["Encoded"]]
	? IsOptionalKey<TField, "~type.optionality"> extends true
		? IsOptionalKey<TCodec, "~encoded.optionality"> extends true
			? unknown
			: MissingKeyMismatch
		: unknown
	: DecodeMismatch<Exclude<TField["Type"], TCodec["Encoded"]>>;

type EncodeCheck<TField extends AnyCodec, TCodec extends AnyCodec> = [
	EncodeOutputOf<TCodec>,
] extends [TField["Type"]]
	? IsOptionalKey<TCodec, "~type.optionality"> extends true
		? IsOptionalKey<TField, "~type.optionality"> extends true
			? unknown
			: OmittedKeyMismatch
		: unknown
	: EncodeMismatch<Exclude<EncodeOutputOf<TCodec>, TField["Type"]>>;

type CodecShapeChecks<F extends Fields, S> = {
	[K in keyof S]: K extends keyof F
		? CodecNodeCheck<F[K], S[K]>
		: UnknownShapeKey<K>;
};

type CodecNodeCheck<TField extends AnyCodec, TNode> = TNode extends NoOpCodec
	? unknown
	: TNode extends ArrayCodecShape<infer TItemShape>
		? [ArrayItemOf<TField>] extends [never]
			? unknown
			: {
					readonly itemShape: CodecNodeCheck<
						ArrayItemOf<TField>,
						TItemShape
					>;
				}
		: TNode extends AnyCodec
			? DecodeCheck<TField, TNode> & EncodeCheck<TField, TNode>
			: [StructFieldsOf<TField>] extends [never]
				? unknown
				: CodecShapeChecks<StructFieldsOf<TField>, TNode>;

// -- The derived fields --
//
// noOp keeps the source field; a codec is composed onto it with
// `Schema.decodeTo`, so the field's Encoded side (and encoded key
// optionality) stays the source's and its Type side is the codec's.

type ComposedField<TField extends AnyCodec, TNode> = TNode extends NoOpCodec
	? TField
	: TNode extends ArrayCodecShape<infer TItemShape>
		? RewrapLike<
				TField,
				Schema.$Array<ComposedField<ArrayItemOf<TField>, TItemShape>>
			>
		: TNode extends AnyCodec
			? Schema.decodeTo<TNode, TField>
			: RewrapLike<
					TField,
					StrictFieldAdapterCodec<
						StructOf<TField>,
						ComposedFields<StructFieldsOf<TField>, TNode>
					>
				>;

// Ends in `& {}` so hovers show the resolved fields instead of the alias.
type ComposedFields<F extends Fields, S> = {
	readonly [K in keyof F]: ComposedField<
		F[K],
		K extends keyof S ? S[K] : NoOpCodec
	>;
} & {};

// -- Runtime --

function isNoOpCodec(v: unknown): v is NoOpCodec {
	return (
		typeof v === "object" &&
		v !== null &&
		"__noOpCodec" in v &&
		(v as NoOpCodec).__noOpCodec === true
	);
}

function isArrayCodecShape(v: unknown): v is ArrayCodecShape {
	return (
		typeof v === "object" &&
		v !== null &&
		"__arrayCodecShape" in v &&
		(v as ArrayCodecShape).__arrayCodecShape === true &&
		"itemShape" in v
	);
}

function compileStruct(
	source: Schema.Top,
	shape: RuntimeCodecShape,
	label: string,
): Schema.Top {
	if (!isStructSchema(source)) {
		throw new Error("Codec shape does not match nested object schema.");
	}
	// Struct checks run on the source's Type, which the derived struct
	// replaces, so there is nowhere to run them.
	if ((source.ast.checks?.length ?? 0) > 0) {
		throw new Error(
			`Struct${label === "" ? "" : ` "${label}"`} has checks, which a derived struct cannot keep. Check the derived struct instead.`,
		);
	}
	for (const key of Object.keys(shape)) {
		if (!Object.hasOwn(source.fields, key)) {
			throw new Error(`Codec shape key "${key}" is not in schema.`);
		}
	}

	const fields: Record<string, Schema.Top> = {};
	const typeFields: Record<string, Schema.Top> = {};
	for (const key of Object.keys(source.fields)) {
		const path = label === "" ? key : `${label}.${key}`;
		if (!Object.hasOwn(shape, key)) {
			throw new Error(`Codec shape is missing schema key "${path}".`);
		}
		const field = compileNode(
			source.fields[key] as Schema.Top,
			shape[key],
			path,
		);
		fields[key] = field;
		typeFields[key] = Schema.toType(field);
	}

	// `rebuild` (and so `annotate`, `check`) reuses these options, so the
	// result keeps `from` and `to`.
	const struct = Schema.Struct(fields);
	return Schema.make<Schema.Top>(struct.ast, {
		fields: struct.fields,
		mapFields: struct.mapFields,
		from: source,
		to: Schema.Struct(typeFields),
	});
}

function compileNode(
	field: Schema.Top,
	node: unknown,
	label: string,
): Schema.Top {
	if (isNoOpCodec(node)) return field;

	if (isArrayCodecShape(node)) {
		const { inner, wrappers } = unwrapNullish(field);
		if (!isArraySchema(inner)) {
			throw new Error("Codec shape expects an array schema.");
		}
		const item = compileNode(inner.value, node.itemShape, `${label}[]`);
		return rewrap(Schema.Array(item), wrappers);
	}

	if (Schema.isSchema(node)) return field.pipe(Schema.decodeTo(node));

	if (typeof node !== "object" || node === null) {
		throw new Error(
			`Codec shape entry "${label}" must be fieldCodec.noOp, a schema, a nested shape, or fieldCodec.arrayOf(...).`,
		);
	}
	const { inner, wrappers } = unwrapNullish(field);
	return rewrap(
		compileStruct(inner, node as RuntimeCodecShape, label),
		wrappers,
	);
}
