/* eslint-disable @typescript-eslint/no-explicit-any -- Library typecasts */
/** biome-ignore-all lint/suspicious/noExplicitAny: Library generic shape */

import { z } from "zod/v4";
import type {
	CodecPair,
	NoOpCodec,
	SchemaShapeOf as SharedSchemaShapeOf,
	Simplify,
} from "../../core/types.js";
import {
	type CodecInOutputOf,
	type DefTypeOf,
	type Direction,
	finalizeIssues,
	type IsOptionalOutput,
	innerTypeOf,
	isCodec,
	isZodSchema,
	type ObjectConfigOf,
	type OptionalOutputSchema,
	objectCatchall,
	pipeOut,
	runSchema,
	schemaType,
	transformsOnly,
	withoutOutCheck,
} from "../../core/zod-internals.js";

// -- Exports --

export const noOpCodec = { __noOpCodec: true } as const satisfies NoOpCodec;

export type ShapeOfStrictFieldAdapter<TServer extends object> = {
	[K in KnownKeys<TServer>]-?: StrictFieldAdapterNodeForValue<TServer[K]>;
};

export type ShapeOfStrictFieldAdapterCodec<TServer extends object> =
	ShapeOfStrictFieldAdapter<TServer>;

export function arrayOfCodecShapes<
	const TItemShape extends RuntimeArrayItemShape,
>(itemShape: TItemShape): ArrayCodecShape<TItemShape> {
	return { __arrayCodecShape: true, itemShape };
}

export function buildStrictFieldAdapterCodec<
	TInputSchema extends z.ZodObject,
	const S extends CodecShapeForSchemaShape<SchemaShapeOf<TInputSchema>>,
>(
	inputSchema: TInputSchema,
	shape: S & NoInfer<CodecShapeChecks<SchemaShapeOf<TInputSchema>, S>>,
): z.ZodCodec<
	TInputSchema,
	z.ZodObject<
		OutputZodShapeForSchemaShape<SchemaShapeOf<TInputSchema>, S>,
		ObjectConfigOf<TInputSchema>
	>
> {
	const compiled = compileObject(
		shape as RuntimeCodecShape,
		inputSchema as unknown as SourceObjectSchema,
	);
	const plan = compiled.plan;

	// Built with plain types and cast once: checking z.codec against the
	// generic out type would make TypeScript explore the whole conditional
	// out-shape machinery (about 15k instantiations) for no benefit.
	// Field codec failures become issues on the object codec's payload, with
	// their full path, so `safeDecode`/`safeEncode` report them.
	return z.codec(
		inputSchema as unknown as z.ZodType,
		compiled.out as z.ZodType,
		{
			decode: (data, payload) =>
				runPlan(plan, data, "decode", [], payload.issues),
			encode: (data, payload) =>
				runPlan(plan, data, "encode", [], payload.issues),
		},
	) as never;
}

export function buildStrictFieldAdapter<InputType extends object>(): <
	const S extends ShapeOfStrictFieldAdapter<InputType>,
>(
	shape: S & NoInfer<AdapterShapeChecks<InputType, S>>,
) => CodecPair<InputType, OutputOfStrictFieldAdapter<InputType, S>>;

export function buildStrictFieldAdapter<
	InputType extends object,
	const S extends ShapeOfStrictFieldAdapter<InputType>,
>(
	shape: S & NoInfer<AdapterShapeChecks<InputType, S>>,
): CodecPair<InputType, OutputOfStrictFieldAdapter<InputType, S>>;

export function buildStrictFieldAdapter<
	InputType extends object,
	const S extends ShapeOfStrictFieldAdapter<InputType>,
>(shape?: S): unknown {
	if (shape === undefined) {
		return (deferredShape: RuntimeCodecShape) =>
			buildStrictFieldAdapter<InputType, S>(deferredShape as never);
	}

	type OutputType = OutputOfStrictFieldAdapter<InputType, S>;
	const plan = compileObject(shape as RuntimeCodecShape, undefined).plan;

	const decode = (data: InputType): OutputType =>
		runPlanOrThrow(plan, data, "decode") as OutputType;

	const encode = (data: OutputType): InputType =>
		runPlanOrThrow(plan, data, "encode") as InputType;

	return {
		decode,
		encode,
	} satisfies CodecPair<InputType, OutputType>;
}

// -- Internals --

type RuntimeCodecShape = Record<string, unknown>;
// Type-level checks use zod core interfaces: matching a schema against the
// classic `z.ZodType`/`z.ZodCodec` forces a structural comparison of the whole
// classic method surface (~80k instantiations on first use).
type AnySchema = z.core.$ZodType;
type AnyZodSchema = z.core.$ZodType<any, any>;
type AnySchemaCodec = z.core.$ZodCodec<AnyZodSchema, AnyZodSchema>;
type CodecWithOutputSchema<TSchema extends AnySchema> = z.core.$ZodCodec<
	AnyZodSchema,
	TSchema
>;
type KnownKeys<T> = {
	[K in keyof T]-?: string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K;
}[keyof T];

interface ArrayCodecShape<
	TItemShape extends RuntimeArrayItemShape = RuntimeCodecShape,
> {
	readonly __arrayCodecShape: true;
	readonly itemShape: TItemShape;
}

type RuntimeArrayItemShape = RuntimeCodecShape | AnySchemaCodec | NoOpCodec;

type InputCompatibleCodecForValue<TInput> = AnySchemaCodec & {
	decode: (v: TInput) => unknown;
};

type ArrayItemOfValue<TValue> =
	NonNullable<TValue> extends readonly (infer TItem)[] ? TItem : never;

type IsArrayValue<TValue> =
	NonNullable<TValue> extends readonly unknown[] ? true : false;

type IsPlainObjectValue<TValue> =
	NonNullable<TValue> extends object
		? NonNullable<TValue> extends readonly unknown[]
			? false
			: NonNullable<TValue> extends (...args: any[]) => unknown
				? false
				: NonNullable<TValue> extends Date
					? false
					: true
		: false;

type StrictArrayItemNodeForValue<TValue> =
	IsPlainObjectValue<ArrayItemOfValue<TValue>> extends true
		?
				| ShapeOfStrictFieldAdapter<
						NonNullable<ArrayItemOfValue<TValue>>
				  >
				| InputCompatibleCodecForValue<ArrayItemOfValue<TValue>>
				| NoOpCodec
		: InputCompatibleCodecForValue<ArrayItemOfValue<TValue>> | NoOpCodec;

type StrictFieldAdapterNodeForValue<TValue> =
	IsArrayValue<TValue> extends true
		?
				| ArrayCodecShape<StrictArrayItemNodeForValue<TValue>>
				| InputCompatibleCodecForValue<TValue>
				| NoOpCodec
		: IsPlainObjectValue<TValue> extends true
			?
					| ShapeOfStrictFieldAdapter<NonNullable<TValue>>
					| InputCompatibleCodecForValue<TValue>
					| NoOpCodec
			: InputCompatibleCodecForValue<TValue> | NoOpCodec;

// -- Shape checks --
//
// The constraints on S check the decode direction: each codec accepts its
// field's value. These checks, applied as `shape: S & NoInfer<Checks>`, add
// what a constraint can't see because it doesn't know S:
// - the encode direction: what a codec can encode must be accepted by the
//   field (`EncodeMismatch<X>` names the values `X` the field would reject);
// - keys that are not in the schema (`UnknownShapeKey<K>`).
// A passing node maps to `unknown`. A failing one maps to an interface the
// node lacks, so the error lands on that key and says what is wrong.

/** The value a codec's encode may produce that the field does not accept. */
interface EncodeMismatch<TRejected> {
	readonly "~codec can encode values the field does not accept": TRejected;
}

/** A shape key that the schema (or input type) does not have. */
interface UnknownShapeKey<TKey> {
	readonly "~shape key is not in the schema": TKey;
}

type NullishNotIn<T> =
	| (null extends T ? never : null)
	| (undefined extends T ? never : undefined);

// Encode returns the codec's `in` output. Codecs map null to null and
// undefined to undefined, so a nullish value the `out` side cannot hold is
// assumed not to come back out (`nullable.*` codecs take
// `string | null | undefined` but encode only `string | null`).
type EncodeOutputOf<TCodec> = Exclude<
	CodecInOutputOf<TCodec>,
	NullishNotIn<z.output<TCodec>>
>;

type EncodeCheck<TFieldValue, TCodec> = [EncodeOutputOf<TCodec>] extends [
	TFieldValue,
]
	? unknown
	: EncodeMismatch<Exclude<EncodeOutputOf<TCodec>, TFieldValue>>;

type CodecShapeChecks<TShape extends z.ZodRawShape, S> = {
	[K in keyof S]: K extends keyof TShape
		? CodecNodeCheck<TShape[K], S[K]>
		: UnknownShapeKey<K>;
};

type CodecNodeCheck<
	TField extends AnySchema,
	TNode,
> = TNode extends AnySchemaCodec
	? EncodeCheck<FieldValue<TField>, TNode>
	: TNode extends NoOpCodec
		? unknown
		: TNode extends ArrayCodecShape<infer TItemShape>
			? ArrayItemSchemaOf<TField> extends never
				? unknown
				: {
						readonly itemShape: CodecNodeCheck<
							ArrayItemSchemaOf<TField>,
							TItemShape
						>;
					}
			: NestedSchemaShape<TField> extends never
				? unknown
				: CodecShapeChecks<NestedSchemaShape<TField>, TNode>;

type AdapterShapeChecks<TInput, S> = {
	[K in keyof S]: K extends keyof TInput
		? AdapterNodeCheck<TInput[K], S[K]>
		: UnknownShapeKey<K>;
};

type AdapterNodeCheck<TValue, TNode> = TNode extends AnySchemaCodec
	? EncodeCheck<TValue, TNode>
	: TNode extends NoOpCodec
		? unknown
		: TNode extends ArrayCodecShape<infer TItemShape>
			? {
					readonly itemShape: AdapterNodeCheck<
						ArrayItemOfValue<TValue>,
						TItemShape
					>;
				}
			: IsPlainObjectValue<TValue> extends true
				? AdapterShapeChecks<NonNullable<TValue>, TNode>
				: unknown;

type OutputOfStrictFieldAdapterArrayItem<TInputItem, TShapeNode> =
	TShapeNode extends CodecWithOutputSchema<infer TSchema>
		? z.output<TSchema>
		: TShapeNode extends NoOpCodec
			? TInputItem
			: TShapeNode extends RuntimeCodecShape
				? IsPlainObjectValue<TInputItem> extends true
					?
							| OutputOfStrictFieldAdapter<
									NonNullable<TInputItem>,
									TShapeNode
							  >
							| Extract<TInputItem, null | undefined>
					: never
				: never;

type OutputOfStrictFieldAdapterNode<TInputValue, TShapeNode> =
	TShapeNode extends CodecWithOutputSchema<infer TSchema>
		? z.output<TSchema>
		: TShapeNode extends NoOpCodec
			? TInputValue
			: TShapeNode extends ArrayCodecShape<infer TItemShape>
				?
						| Array<
								OutputOfStrictFieldAdapterArrayItem<
									ArrayItemOfValue<TInputValue>,
									TItemShape
								>
						  >
						| Extract<TInputValue, null | undefined>
				: TShapeNode extends RuntimeCodecShape
					? IsPlainObjectValue<TInputValue> extends true
						?
								| OutputOfStrictFieldAdapter<
										NonNullable<TInputValue>,
										TShapeNode
								  >
								| Extract<TInputValue, null | undefined>
						: never
					: never;

// Key optionality follows the derived schema's rules: noOp, nested and array
// fields keep the source key's `?`, and a codec field is optional exactly
// when its `out` schema is optional (as `z.object` would infer it).

type OutputOfStrictFieldAdapter<TInput extends object, S> = Simplify<
	{
		[K in keyof TInput as K extends keyof S
			? S[K] extends AnySchemaCodec
				? never
				: K
			: never]: OutputOfStrictFieldAdapterNode<TInput[K], S[K & keyof S]>;
	} & {
		[K in KnownKeys<S> as S[K] extends OptionalOutputSchema
			? K
			: never]?: z.output<S[K]>;
	} & {
		[K in KnownKeys<S> as S[K] extends AnySchemaCodec
			? S[K] extends OptionalOutputSchema
				? never
				: K
			: never]: z.output<S[K]>;
	}
>;

type SchemaShapeOf<TSchema extends z.ZodObject> = SharedSchemaShapeOf<TSchema>;

type UnwrapOptionalNullableSchema<TSchema extends AnySchema> =
	TSchema extends z.core.$ZodOptional<infer TInner extends AnySchema>
		? UnwrapOptionalNullableSchema<TInner>
		: TSchema extends z.core.$ZodNullable<infer TInner extends AnySchema>
			? UnwrapOptionalNullableSchema<TInner>
			: TSchema;

/** Puts `TInner` back inside the optional/nullable wrappers of `TField`. */
type RewrapLike<TField extends AnySchema, TInner extends AnySchema> =
	TField extends z.core.$ZodOptional<infer TWrapped extends AnySchema>
		? z.ZodOptional<RewrapLike<TWrapped, TInner>>
		: TField extends z.core.$ZodNullable<infer TWrapped extends AnySchema>
			? z.ZodNullable<RewrapLike<TWrapped, TInner>>
			: TInner;

/** For wide `z.ZodType<T>` fields: wrap `TInner` by the nullishness of `T`. */
type WrapLikeValue<TValue, TInner extends AnySchema> = null extends TValue
	? undefined extends TValue
		? z.ZodOptional<z.ZodNullable<TInner>>
		: z.ZodNullable<TInner>
	: undefined extends TValue
		? z.ZodOptional<TInner>
		: TInner;

/** Strips the wrappers that don't change what a schema outputs. */
type UnwrapForOutput<TSchema extends AnySchema> = TSchema extends
	| z.core.$ZodOptional<infer TInner extends AnySchema>
	| z.core.$ZodNullable<infer TInner extends AnySchema>
	| z.core.$ZodDefault<infer TInner extends AnySchema>
	| z.core.$ZodPrefault<infer TInner extends AnySchema>
	| z.core.$ZodCatch<infer TInner extends AnySchema>
	? UnwrapForOutput<TInner>
	: TSchema;

// A noOp field's out schema validates the decoded value, so a source field
// that transforms (a pipe, codec, preprocess or .transform()) can't reuse its
// own schema there; it gets one typed by its output instead.
type NoOpOutSchema<TField extends AnySchema> =
	DefTypeOf<UnwrapForOutput<TField>> extends "pipe" | "transform"
		? IsOptionalOutput<TField> extends true
			? z.ZodOptional<
					ZodTypeForValue<Exclude<z.output<TField>, undefined>>
				>
			: ZodTypeForValue<z.output<TField>>
		: TField;

type ObjectSchemaOf<TSchema extends AnySchema> =
	UnwrapOptionalNullableSchema<TSchema> extends z.core.$ZodObject
		? UnwrapOptionalNullableSchema<TSchema>
		: never;

type ShapeOfObjectSchema<TSchema extends z.core.$ZodObject> =
	TSchema extends z.core.$ZodObject<infer TShape, any> ? TShape : never;

type NestedSchemaShape<TSchema extends AnySchema> =
	ObjectSchemaOf<TSchema> extends z.core.$ZodObject
		? ShapeOfObjectSchema<ObjectSchemaOf<TSchema>>
		: never;

type ArrayItemSchemaOf<TSchema extends AnySchema> =
	UnwrapOptionalNullableSchema<TSchema> extends z.core.$ZodArray<
		infer TItem extends AnySchema
	>
		? TItem
		: never;

type ArrayItemSchemaShape<TSchema extends AnySchema> =
	ArrayItemSchemaOf<TSchema> extends AnySchema
		? NestedSchemaShape<ArrayItemSchemaOf<TSchema>>
		: never;

type IsWideZodType<TSchema extends AnySchema> =
	z.core.$ZodTypeDef["type"] extends DefTypeOf<TSchema> ? true : false;

type FieldOutput<TSchema extends AnySchema> = NonNullable<z.output<TSchema>>;

type ArrayItemOutput<TSchema extends AnySchema> = ArrayItemOfValue<
	FieldOutput<TSchema>
>;

type ArrayItemObjectOutput<TSchema extends AnySchema> =
	ArrayItemOutput<TSchema> extends object ? ArrayItemOutput<TSchema> : never;

type ObjectOutput<TSchema extends AnySchema> =
	FieldOutput<TSchema> extends readonly unknown[]
		? never
		: FieldOutput<TSchema> extends object
			? FieldOutput<TSchema>
			: never;

type ZodTypeForValue<TValue> = z.ZodType<TValue, TValue>;
// A field codec decodes what the source schema produced, so it is checked
// against the field's output type (after defaults, catch, preprocess and
// transforms), in both directions.
type FieldValue<TField extends AnySchema> = z.output<TField>;
type InputCompatibleCodecForField<TField extends AnySchema> = AnySchemaCodec & {
	decode: (v: FieldValue<TField>) => unknown;
};
type ArrayItemValue<TField extends AnySchema> =
	ArrayItemSchemaOf<TField> extends AnySchema
		? z.output<ArrayItemSchemaOf<TField>>
		: never;
type InputCompatibleCodecForArrayItem<TField extends AnySchema> =
	ArrayItemSchemaOf<TField> extends AnySchema
		? AnySchemaCodec & {
				decode: (v: ArrayItemValue<TField>) => unknown;
			}
		: never;
type IsArraySchema<TSchema extends AnySchema> =
	ArrayItemSchemaOf<TSchema> extends never ? false : true;
type ArrayItemNodeForField<TField extends AnySchema> =
	ArrayItemSchemaShape<TField> extends never
		? InputCompatibleCodecForArrayItem<TField> | NoOpCodec
		:
				| CodecShapeForSchemaShape<ArrayItemSchemaShape<TField>>
				| InputCompatibleCodecForArrayItem<TField>
				| NoOpCodec;

type WideObjectShapeNodeForField<TField extends AnySchema> = [
	ObjectOutput<TField>,
] extends [never]
	? never
	: RuntimeCodecShape;

type WideArrayShapeNodeForField<TField extends AnySchema> = [
	ArrayItemObjectOutput<TField>,
] extends [never]
	? never
	: ArrayCodecShape;

type CodecShapeNodeForField<TField extends AnySchema> =
	IsArraySchema<TField> extends true
		?
				| ArrayCodecShape<ArrayItemNodeForField<TField>>
				| InputCompatibleCodecForField<TField>
				| NoOpCodec
		: NestedSchemaShape<TField> extends never
			? IsWideZodType<TField> extends true
				?
						| InputCompatibleCodecForField<TField>
						| NoOpCodec
						| WideObjectShapeNodeForField<TField>
						| WideArrayShapeNodeForField<TField>
				: InputCompatibleCodecForField<TField> | NoOpCodec
			:
					| CodecShapeForSchemaShape<NestedSchemaShape<TField>>
					| InputCompatibleCodecForField<TField>
					| NoOpCodec;

type OutputZodArrayItemFromCodecNode<TItemShape> =
	TItemShape extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? z.ZodUnknown
			: TItemShape extends RuntimeCodecShape
				? z.ZodObject<OutputZodShapeFromCodecShape<TItemShape>>
				: never;

type OutputZodArrayItemFromOutputValue<TValue, TItemShape> =
	TItemShape extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? ZodTypeForValue<TValue>
			: TItemShape extends RuntimeCodecShape
				? TValue extends object
					? z.ZodObject<
							OutputZodShapeFromOutputObject<TValue, TItemShape>
						>
					: never
				: never;

type OutputZodArrayItemForInputField<
	TInputField extends AnySchema,
	TItemShape,
> =
	TItemShape extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? NoOpOutSchema<ArrayItemSchemaOf<TInputField>>
			: TItemShape extends RuntimeCodecShape
				? ArrayItemSchemaShape<TInputField> extends never
					? IsWideZodType<TInputField> extends true
						? [ArrayItemObjectOutput<TInputField>] extends [never]
							? z.ZodObject<
									OutputZodShapeFromCodecShape<TItemShape>
								>
							: z.ZodObject<
									OutputZodShapeFromOutputObject<
										ArrayItemObjectOutput<TInputField>,
										TItemShape
									>
								>
						: never
					: RewrapLike<
							ArrayItemSchemaOf<TInputField>,
							z.ZodObject<
								OutputZodShapeForSchemaShape<
									ArrayItemSchemaShape<TInputField>,
									TItemShape
								>,
								ObjectConfigOf<
									ObjectSchemaOf<
										ArrayItemSchemaOf<TInputField>
									>
								>
							>
						>
				: never;

type CodecShapeForSchemaShape<TShape extends z.ZodRawShape> = {
	[K in keyof TShape]: CodecShapeNodeForField<TShape[K]>;
};

type OutputZodShapeFromCodecShape<S extends RuntimeCodecShape> = {
	[K in KnownKeys<S>]: S[K] extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: S[K] extends NoOpCodec
			? z.ZodUnknown
			: S[K] extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<OutputZodArrayItemFromCodecNode<TItemShape>>
				: S[K] extends RuntimeCodecShape
					? z.ZodObject<OutputZodShapeFromCodecShape<S[K]>>
					: never;
} & {};

type OutputZodShapeFromOutputObject<
	TObj extends object,
	S extends RuntimeCodecShape,
> = {
	[K in KnownKeys<S>]: S[K] extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: S[K] extends NoOpCodec
			? K extends keyof TObj
				? ZodTypeForValue<TObj[K]>
				: z.ZodUnknown
			: S[K] extends ArrayCodecShape<infer TItemShape>
				? K extends keyof TObj
					? z.ZodArray<
							OutputZodArrayItemFromOutputValue<
								ArrayItemOfValue<TObj[K]>,
								TItemShape
							>
						>
					: z.ZodArray<OutputZodArrayItemFromCodecNode<TItemShape>>
				: S[K] extends RuntimeCodecShape
					? K extends keyof TObj
						? NonNullable<TObj[K]> extends object
							? z.ZodObject<
									OutputZodShapeFromOutputObject<
										NonNullable<TObj[K]>,
										S[K]
									>
								>
							: never
						: z.ZodObject<OutputZodShapeFromCodecShape<S[K]>>
					: never;
} & {};

type OutputZodNode<TInputField extends AnySchema, TShapeNode> =
	TShapeNode extends CodecWithOutputSchema<infer TSchema>
		? TSchema
		: TShapeNode extends NoOpCodec
			? NoOpOutSchema<TInputField>
			: TShapeNode extends ArrayCodecShape<infer TItemShape>
				? IsWideZodType<TInputField> extends true
					? WrapLikeValue<
							z.output<TInputField>,
							z.ZodArray<
								OutputZodArrayItemForInputField<
									TInputField,
									TItemShape
								>
							>
						>
					: RewrapLike<
							TInputField,
							z.ZodArray<
								OutputZodArrayItemForInputField<
									TInputField,
									TItemShape
								>
							>
						>
				: TShapeNode extends Record<string, any>
					? NestedSchemaShape<TInputField> extends never
						? IsWideZodType<TInputField> extends true
							? WrapLikeValue<
									z.output<TInputField>,
									[ObjectOutput<TInputField>] extends [never]
										? z.ZodObject<
												OutputZodShapeFromCodecShape<TShapeNode>
											>
										: z.ZodObject<
												OutputZodShapeFromOutputObject<
													ObjectOutput<TInputField>,
													TShapeNode
												>
											>
								>
							: never
						: RewrapLike<
								TInputField,
								z.ZodObject<
									OutputZodShapeForSchemaShape<
										NestedSchemaShape<TInputField>,
										TShapeNode
									>,
									ObjectConfigOf<ObjectSchemaOf<TInputField>>
								>
							>
					: never;

// The out-shape aliases end in `& {}` so hovers show the resolved shape
// instead of the alias (the intersection reduces to the bare mapped type).
type OutputZodShapeForSchemaShape<TShape extends z.ZodRawShape, S> = {
	[K in KnownKeys<S>]: K extends keyof TShape
		? OutputZodNode<TShape[K], S[K]>
		: never;
} & {};

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

type ZodSchemaType = "array" | "nullable" | "object" | "optional";

function hasSchemaType(schema: z.ZodTypeAny, type: ZodSchemaType): boolean {
	return schemaType(schema) === type;
}

function isZodObjectSchema(schema: z.ZodTypeAny): schema is z.ZodObject {
	return hasSchemaType(schema, "object") && "shape" in schema;
}

function isZodArraySchema(
	schema: z.ZodTypeAny,
): schema is z.ZodArray<z.ZodTypeAny> {
	return hasSchemaType(schema, "array") && "element" in schema;
}

function getSchemaNode(schemaShape: z.ZodRawShape, key: string): z.ZodTypeAny {
	const schemaNode = schemaShape[key];
	if (schemaNode === undefined) {
		throw new Error(`Codec shape key "${key}" is not in schema.`);
	}

	if (!isZodSchema(schemaNode)) {
		throw new Error(`Schema key "${key}" is not a Zod schema.`);
	}

	return schemaNode;
}

/**
 * The part of a schema that validates its output: a pipe's `out` (so a
 * codec's `out`), and a pass-through for a bare transform, which has no
 * output schema. Wrappers are kept around a changed inner schema (dropped
 * for default/prefault/catch, which never output undefined). Anything else
 * is returned as is.
 */
function outputSide(schema: z.ZodTypeAny): z.ZodTypeAny {
	const type = schemaType(schema);
	const out = type === "pipe" ? pipeOut(schema) : undefined;
	if (out !== undefined) return outputSide(out);
	if (type === "transform") {
		return z.custom();
	}
	if (type === "optional" || type === "nullable") {
		const inner = (
			schema as unknown as { unwrap(): z.ZodTypeAny }
		).unwrap();
		const side = outputSide(inner);
		if (side === inner) return schema;
		return type === "optional" ? side.optional() : side.nullable();
	}
	const inner =
		type === "default" || type === "prefault" || type === "catch"
			? innerTypeOf(schema)
			: undefined;
	if (inner !== undefined) {
		const side = outputSide(inner);
		return side === inner ? schema : side;
	}
	return schema;
}

type NullishWrapper = "nullable" | "optional";

/** Strips optional/nullable wrappers, remembering them outermost first. */
function unwrapNullish(schema: z.ZodTypeAny): {
	inner: z.ZodTypeAny;
	wrappers: NullishWrapper[];
} {
	const wrappers: NullishWrapper[] = [];
	let inner: z.ZodTypeAny = schema;
	for (;;) {
		const type = schemaType(inner);
		if (type !== "optional" && type !== "nullable") break;
		const unwrap = (inner as { unwrap?: () => z.ZodTypeAny }).unwrap;
		if (typeof unwrap !== "function") {
			throw new Error(
				"Expected an unwrap-able optional or nullable schema.",
			);
		}
		wrappers.push(type);
		inner = unwrap.call(inner);
	}
	return { inner, wrappers };
}

function rewrap(
	schema: z.ZodTypeAny,
	wrappers: readonly NullishWrapper[],
): z.ZodTypeAny {
	let result = schema;
	for (let i = wrappers.length - 1; i >= 0; i--) {
		result =
			wrappers[i] === "optional" ? result.optional() : result.nullable();
	}
	return result;
}

// The shape is compiled once into a plan. With a schema, compiling also
// checks the shape against it and builds the derived `out` schema.
type Plan =
	| { readonly kind: "noOp" }
	| { readonly kind: "codec"; readonly codec: z.ZodCodec }
	| { readonly kind: "array"; readonly item: Plan }
	| ObjectPlan;

interface ObjectPlan {
	readonly kind: "object";
	readonly fields: ReadonlyArray<readonly [string, Plan]>;
	/** Copy keys outside the shape (the source is loose or has a catchall). */
	readonly keepUnknownKeys: boolean;
	readonly fieldKeys: ReadonlySet<string>;
}

const noOpPlan: Plan = { kind: "noOp" };

type SourceObjectSchema = { shape: z.ZodRawShape };

function compileObject(
	shape: RuntimeCodecShape,
	schema: SourceObjectSchema | undefined,
	label = "",
): { plan: ObjectPlan; out: z.ZodTypeAny | undefined } {
	const fields: [string, Plan][] = [];
	const outShape: Record<string, z.ZodTypeAny> = {};
	for (const key of Object.keys(shape)) {
		const fieldSchema =
			schema === undefined ? undefined : getSchemaNode(schema.shape, key);
		const compiled = compileNode(
			shape[key],
			fieldSchema,
			label === "" ? key : `${label}.${key}`,
		);
		fields.push([key, compiled.plan]);
		if (compiled.out !== undefined) outShape[key] = compiled.out;
	}

	// The derived object keeps the source's unknown-key policy: strict and
	// loose are catchalls (never / unknown) in Zod 4, strip has none.
	const catchall = objectCatchall(schema);
	const plan: ObjectPlan = {
		kind: "object",
		fields,
		keepUnknownKeys: catchall !== undefined,
		fieldKeys: new Set(Object.keys(shape)),
	};
	if (schema === undefined) return { plan, out: undefined };
	const out = z.object(outShape);
	return { plan, out: catchall === undefined ? out : out.catchall(catchall) };
}

function compileNode(
	node: unknown,
	schema: z.ZodTypeAny | undefined,
	label: string,
): { plan: Plan; out: z.ZodTypeAny | undefined } {
	if (isCodec(node)) {
		// With a schema, the object's `out` contains `node.out` and validates
		// it, so the codec runs without its own `out` check; if the source
		// field is the codec's `in` schema itself, the source schema has
		// checked that too. Without a schema the whole codec runs.
		const run =
			schema === undefined
				? node
				: schema === node.in
					? transformsOnly(node)
					: withoutOutCheck(node);
		return {
			plan: { kind: "codec", codec: run },
			out: node.out as z.ZodTypeAny,
		};
	}

	if (isNoOpCodec(node)) {
		return {
			plan: noOpPlan,
			out: schema === undefined ? undefined : outputSide(schema),
		};
	}

	const unwrapped = schema === undefined ? undefined : unwrapNullish(schema);

	if (isArrayCodecShape(node)) {
		if (unwrapped !== undefined && !isZodArraySchema(unwrapped.inner)) {
			throw new Error("Codec shape expects an array schema.");
		}
		const item = compileNode(
			node.itemShape,
			(unwrapped?.inner as z.ZodArray<z.ZodTypeAny> | undefined)?.element,
			`${label}[]`,
		);
		return {
			plan: { kind: "array", item: item.plan },
			out:
				unwrapped === undefined || item.out === undefined
					? undefined
					: rewrap(z.array(item.out), unwrapped.wrappers),
		};
	}

	if (isZodSchema(node)) {
		throw new Error(
			`Codec shape entry "${label}" is a Zod schema but not a codec. Use fieldCodec.noOp, a z.codec(...), a nested shape, or fieldCodec.arrayOf(...).`,
		);
	}
	if (unwrapped !== undefined && !isZodObjectSchema(unwrapped.inner)) {
		throw new Error("Codec shape does not match nested object schema.");
	}
	const nested = compileObject(
		asRecord(node),
		unwrapped?.inner as SourceObjectSchema | undefined,
		label,
	);
	return {
		plan: nested.plan,
		out:
			unwrapped === undefined || nested.out === undefined
				? undefined
				: rewrap(nested.out, unwrapped.wrappers),
	};
}

function asRecord(v: unknown): Record<string, unknown> {
	return typeof v === "object" && v !== null
		? (v as Record<string, unknown>)
		: {};
}

type IssuePath = readonly PropertyKey[];

function runPlanOrThrow(
	plan: Plan,
	value: unknown,
	direction: Direction,
): unknown {
	const issues: z.core.$ZodRawIssue[] = [];
	const result = runPlan(plan, value, direction, [], issues);
	if (issues.length > 0) {
		throw new z.ZodError(finalizeIssues(issues));
	}
	return result;
}

function runPlan(
	plan: Plan,
	value: unknown,
	direction: Direction,
	path: IssuePath,
	issues: z.core.$ZodRawIssue[],
): unknown {
	switch (plan.kind) {
		case "noOp":
			return value;
		case "codec": {
			const result = runSchema(plan.codec, value, direction, false);
			if (result.issues.length === 0) return result.value;
			for (const issue of result.issues) {
				issues.push({
					...issue,
					path: [...path, ...(issue.path ?? [])],
				});
			}
			return value;
		}
		case "array":
			// null, undefined (and anything the schema let through) pass as is.
			if (!Array.isArray(value)) return value;
			return value.map((item, index) =>
				runPlan(plan.item, item, direction, [...path, index], issues),
			);
		case "object": {
			if (typeof value !== "object" || value === null) return value;
			const data = value as Record<string, unknown>;
			const result: Record<string, unknown> = {};
			for (const [key, child] of plan.fields) {
				// Like z.object: a missing key stays missing. A codec still
				// runs on a missing value (it may supply null or a default);
				// the key is set only if the codec returns something.
				const present = key in data;
				if (!present && child.kind !== "codec") continue;
				const converted = runPlan(
					child,
					data[key],
					direction,
					[...path, key],
					issues,
				);
				if (present || converted !== undefined) {
					setKey(result, key, converted);
				}
			}
			if (plan.keepUnknownKeys) {
				for (const key of Object.keys(data)) {
					if (!plan.fieldKeys.has(key))
						setKey(result, key, data[key]);
				}
			}
			return result;
		}
	}
}

/** Assigns an own property, even for a key named `__proto__`. */
function setKey(target: Record<string, unknown>, key: string, value: unknown) {
	if (key === "__proto__") {
		Object.defineProperty(target, key, {
			configurable: true,
			enumerable: true,
			value,
			writable: true,
		});
	} else {
		target[key] = value;
	}
}
