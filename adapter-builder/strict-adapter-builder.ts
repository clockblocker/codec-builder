/** biome-ignore-all lint/suspicious/noExplicitAny: library */
import { z } from "zod";

export interface Codec<
	Output,
	Input,
	TSchema extends z.ZodType<Output, z.ZodTypeDef, any> = z.ZodType<
		Output,
		z.ZodTypeDef,
		any
	>,
> {
	fromInput: (v: Input) => Output;
	fromOutput: (v: Output) => Input;
	outputSchema: TSchema;
}

export interface NoOpCodec {
	readonly __noOpCodec: true;
}

export const noOpCodec = { __noOpCodec: true } as const satisfies NoOpCodec;

export type RuntimeCodecShape = Record<string, unknown>;
export type KnownKeys<T> = {
	[K in keyof T]: string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K;
}[keyof T];

export interface ArrayCodecShape<
	TItemShape extends RuntimeArrayItemShape = RuntimeCodecShape,
> {
	readonly __arrayCodecShape: true;
	readonly itemShape: TItemShape;
}

export type RuntimeArrayItemShape =
	| RuntimeCodecShape
	| Codec<any, any, any>
	| NoOpCodec;

type InputCompatibleCodecForValue<TInput> = Codec<any, any, any> & {
	fromInput: (v: TInput) => unknown;
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
				| ShapeOfStrictFieldAdapter<NonNullable<ArrayItemOfValue<TValue>>>
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
			? ShapeOfStrictFieldAdapter<NonNullable<TValue>>
			: InputCompatibleCodecForValue<TValue> | NoOpCodec;

export type ShapeOfStrictFieldAdapter<TServer extends object> = {
	[K in KnownKeys<TServer>]-?: StrictFieldAdapterNodeForValue<TServer[K]>;
};

export type ShapeOfStrictFieeldAdapter<TServer extends object> =
	ShapeOfStrictFieldAdapter<TServer>;

export function arrayOf<const TItemShape extends RuntimeArrayItemShape>(
	itemShape: TItemShape,
): ArrayCodecShape<TItemShape> {
	return { __arrayCodecShape: true, itemShape };
}

export function codecArrayOf<const TItemShape extends RuntimeArrayItemShape>(
	itemShape: TItemShape,
): ArrayCodecShape<TItemShape> {
	return arrayOf(itemShape);
}

export type SchemaShapeOf<TSchema extends z.AnyZodObject> =
	TSchema extends z.ZodObject<infer TShape, any, any, any, any>
		? TShape
		: never;

type UnwrapOptionalNullableSchema<TSchema extends z.ZodTypeAny> =
	TSchema extends z.ZodOptional<infer TInner>
		? UnwrapOptionalNullableSchema<TInner>
		: TSchema extends z.ZodNullable<infer TInner>
			? UnwrapOptionalNullableSchema<TInner>
			: TSchema;

type ObjectSchemaOf<TSchema extends z.ZodTypeAny> =
	UnwrapOptionalNullableSchema<TSchema> extends z.AnyZodObject
		? UnwrapOptionalNullableSchema<TSchema>
		: never;

type ShapeOfObjectSchema<TSchema extends z.AnyZodObject> =
	TSchema extends z.ZodObject<infer TShape, any, any, any, any>
		? TShape
		: never;

export type NestedSchemaShape<TSchema extends z.ZodTypeAny> =
	ObjectSchemaOf<TSchema> extends z.AnyZodObject
		? ShapeOfObjectSchema<ObjectSchemaOf<TSchema>>
		: never;

export type ArrayItemSchemaOf<TSchema extends z.ZodTypeAny> =
	UnwrapOptionalNullableSchema<TSchema> extends z.ZodArray<infer TItem, any>
		? TItem
		: never;

export type ArrayItemSchemaShape<TSchema extends z.ZodTypeAny> =
	ArrayItemSchemaOf<TSchema> extends z.ZodTypeAny
		? NestedSchemaShape<ArrayItemSchemaOf<TSchema>>
		: never;

export type IsWideZodType<TSchema extends z.ZodTypeAny> =
	z.ZodTypeAny extends TSchema ? true : false;

type FieldOutput<TSchema extends z.ZodTypeAny> = NonNullable<
	TSchema extends z.ZodType<infer TOutput, any, any> ? TOutput : never
>;

type ArrayItemOutput<TSchema extends z.ZodTypeAny> = ArrayItemOfValue<
	FieldOutput<TSchema>
>;

export type ArrayItemObjectOutput<TSchema extends z.ZodTypeAny> =
	ArrayItemOutput<TSchema> extends object ? ArrayItemOutput<TSchema> : never;

export type ObjectOutput<TSchema extends z.ZodTypeAny> =
	FieldOutput<TSchema> extends readonly unknown[]
		? never
		: FieldOutput<TSchema> extends object
			? FieldOutput<TSchema>
			: never;

type ZodTypeForValue<TValue> = z.ZodType<TValue, z.ZodTypeDef, TValue>;
type FieldInput<TField extends z.ZodTypeAny> = z.input<TField>;
type InputCompatibleCodecForField<TField extends z.ZodTypeAny> = Codec<
	any,
	any,
	any
> & {
	fromInput: (v: FieldInput<TField>) => unknown;
};
type ArrayItemInput<TField extends z.ZodTypeAny> =
	ArrayItemSchemaOf<TField> extends z.ZodTypeAny
		? z.input<ArrayItemSchemaOf<TField>>
		: never;
type InputCompatibleCodecForArrayItem<TField extends z.ZodTypeAny> =
	ArrayItemSchemaOf<TField> extends z.ZodTypeAny
		? Codec<any, any, any> & {
				fromInput: (v: ArrayItemInput<TField>) => unknown;
			}
		: never;
type IsArraySchema<TSchema extends z.ZodTypeAny> =
	ArrayItemSchemaOf<TSchema> extends never ? false : true;
type ArrayItemNodeForField<TField extends z.ZodTypeAny> =
	ArrayItemSchemaShape<TField> extends never
		? InputCompatibleCodecForArrayItem<TField> | NoOpCodec
		:
				| CodecShapeForSchemaShape<ArrayItemSchemaShape<TField>>
				| InputCompatibleCodecForArrayItem<TField>
				| NoOpCodec;

type WideObjectShapeNodeForField<TField extends z.ZodTypeAny> = [
	ObjectOutput<TField>,
] extends [never]
	? never
	: RuntimeCodecShape;

type WideArrayShapeNodeForField<TField extends z.ZodTypeAny> = [
	ArrayItemObjectOutput<TField>,
] extends [never]
	? never
	: ArrayCodecShape;

type CodecShapeNodeForField<TField extends z.ZodTypeAny> =
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
			: CodecShapeForSchemaShape<NestedSchemaShape<TField>>;

export type OutputZodArrayItemFromCodecNode<TItemShape> =
	TItemShape extends Codec<any, any, infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? z.ZodUnknown
			: TItemShape extends RuntimeCodecShape
				? z.ZodObject<OutputZodShapeFromCodecShape<TItemShape>>
				: never;

type OutputZodArrayItemFromOutputValue<TValue, TItemShape> =
	TItemShape extends Codec<any, any, infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? ZodTypeForValue<TValue>
			: TItemShape extends RuntimeCodecShape
				? TValue extends object
					? z.ZodObject<OutputZodShapeFromOutputObject<TValue, TItemShape>>
					: never
				: never;

type OutputZodArrayItemForInputField<
	TInputField extends z.ZodTypeAny,
	TItemShape,
> =
	TItemShape extends Codec<any, any, infer TSchema>
		? TSchema
		: TItemShape extends NoOpCodec
			? ArrayItemSchemaOf<TInputField>
			: TItemShape extends RuntimeCodecShape
				? ArrayItemSchemaShape<TInputField> extends never
					? IsWideZodType<TInputField> extends true
						? [ArrayItemObjectOutput<TInputField>] extends [never]
							? z.ZodObject<OutputZodShapeFromCodecShape<TItemShape>>
							: z.ZodObject<
									OutputZodShapeFromOutputObject<
										ArrayItemObjectOutput<TInputField>,
										TItemShape
									>
								>
						: never
					: z.ZodObject<
							OutputZodShapeForSchemaShape<
								ArrayItemSchemaShape<TInputField>,
								TItemShape
							>
						>
				: never;

type CodecShapeForSchemaShape<TShape extends z.ZodRawShape> = {
	[K in keyof TShape]: TShape[K] extends z.ZodTypeAny
		? CodecShapeNodeForField<TShape[K]>
		: never;
};

export type OutputZodShapeFromCodecShape<S extends RuntimeCodecShape> = {
	[K in KnownKeys<S>]: S[K] extends Codec<any, any, infer TSchema>
		? TSchema
		: S[K] extends NoOpCodec
			? z.ZodUnknown
			: S[K] extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<OutputZodArrayItemFromCodecNode<TItemShape>>
				: S[K] extends RuntimeCodecShape
					? z.ZodObject<OutputZodShapeFromCodecShape<S[K]>>
					: never;
};

export type OutputZodShapeFromOutputObject<
	TObj extends object,
	S extends RuntimeCodecShape,
> = {
	[K in KnownKeys<S>]: S[K] extends Codec<any, any, infer TSchema>
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
									OutputZodShapeFromOutputObject<NonNullable<TObj[K]>, S[K]>
								>
							: never
						: z.ZodObject<OutputZodShapeFromCodecShape<S[K]>>
					: never;
};

type OutputZodNode<TInputField extends z.ZodTypeAny, TShapeNode> =
	TShapeNode extends Codec<any, any, infer TSchema>
		? TSchema
		: TShapeNode extends NoOpCodec
			? TInputField
			: TShapeNode extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<OutputZodArrayItemForInputField<TInputField, TItemShape>>
				: TShapeNode extends Record<string, any>
					? NestedSchemaShape<TInputField> extends never
						? IsWideZodType<TInputField> extends true
							? [ObjectOutput<TInputField>] extends [never]
								? z.ZodObject<OutputZodShapeFromCodecShape<TShapeNode>>
								: z.ZodObject<
										OutputZodShapeFromOutputObject<
											ObjectOutput<TInputField>,
											TShapeNode
										>
									>
							: never
						: z.ZodObject<
								OutputZodShapeForSchemaShape<
									NestedSchemaShape<TInputField>,
									TShapeNode
								>
							>
					: never;

type OutputZodShapeForSchemaShape<
	TShape extends z.ZodRawShape,
	S extends RuntimeCodecShape,
> = {
	[K in KnownKeys<S>]: K extends keyof TShape
		? TShape[K] extends z.ZodTypeAny
			? OutputZodNode<TShape[K], S[K]>
			: never
		: never;
};

export function isCodec(v: unknown): v is Codec<any, any, any> {
	return (
		typeof v === "object" &&
		v !== null &&
		"fromInput" in v &&
		"fromOutput" in v &&
		"outputSchema" in v
	);
}

export function isNoOpCodec(v: unknown): v is NoOpCodec {
	return (
		typeof v === "object" &&
		v !== null &&
		"__noOpCodec" in v &&
		(v as NoOpCodec).__noOpCodec === true
	);
}

export function isArrayCodecShape(v: unknown): v is ArrayCodecShape {
	return (
		typeof v === "object" &&
		v !== null &&
		"__arrayCodecShape" in v &&
		(v as ArrayCodecShape).__arrayCodecShape === true &&
		"itemShape" in v
	);
}

export function unwrapOptionalNullableSchema(
	schema: z.ZodTypeAny,
): z.ZodTypeAny {
	let current: z.ZodTypeAny = schema;
	while (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
		current = current.unwrap();
	}
	return current;
}

function getNestedObjectSchema(schema: z.ZodTypeAny): z.AnyZodObject {
	const current = unwrapOptionalNullableSchema(schema);

	if (!(current instanceof z.ZodObject)) {
		throw new Error("Codec shape does not match nested object schema.");
	}

	return current;
}

function getArrayItemSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
	const current = unwrapOptionalNullableSchema(schema);

	if (!(current instanceof z.ZodArray)) {
		throw new Error("Codec shape expects an array schema.");
	}

	return current.element;
}

export function tryGetNestedObjectSchema(
	schema: z.ZodTypeAny | undefined,
): z.AnyZodObject | null {
	if (!schema) {
		return null;
	}

	try {
		return getNestedObjectSchema(schema);
	} catch {
		return null;
	}
}

export function tryGetArrayItemSchema(
	schema: z.ZodTypeAny | undefined,
): z.ZodTypeAny | null {
	if (!schema) {
		return null;
	}

	try {
		return getArrayItemSchema(schema);
	} catch {
		return null;
	}
}

export function asRecord(v: unknown): Record<string, unknown> {
	return typeof v === "object" && v !== null
		? (v as Record<string, unknown>)
		: {};
}
function buildOutputZodArrayItem(
	itemShape: RuntimeArrayItemShape,
	itemSchema: z.ZodTypeAny,
): z.ZodTypeAny {
	if (isCodec(itemShape)) {
		return itemShape.outputSchema;
	}

	if (isNoOpCodec(itemShape)) {
		return itemSchema;
	}

	const nestedObjectSchema = getNestedObjectSchema(itemSchema);
	return z.object(
		buildOutputZodShape(
			itemShape as RuntimeCodecShape,
			nestedObjectSchema.shape,
		),
	);
}

function convertArrayItemFromInput(
	itemShape: RuntimeArrayItemShape,
	item: unknown,
): unknown {
	if (isCodec(itemShape)) {
		return itemShape.fromInput(item);
	}

	if (isNoOpCodec(itemShape)) {
		return item;
	}

	return convertFromInput(itemShape as RuntimeCodecShape, asRecord(item));
}

function convertArrayItemFromOutput(
	itemShape: RuntimeArrayItemShape,
	item: unknown,
): unknown {
	if (isCodec(itemShape)) {
		return itemShape.fromOutput(item);
	}

	if (isNoOpCodec(itemShape)) {
		return item;
	}

	return convertFromOutput(itemShape as RuntimeCodecShape, asRecord(item));
}

function buildOutputZodShape(
	shape: RuntimeCodecShape,
	schemaShape: z.ZodRawShape,
): Record<string, z.ZodTypeAny> {
	const result: Record<string, z.ZodTypeAny> = {};
	for (const key in shape) {
		const node = shape[key];
		const schemaNode = schemaShape[key];
		if (!schemaNode) {
			throw new Error(`Codec shape key "${key}" is not in schema.`);
		}

		if (isCodec(node)) {
			result[key] = node.outputSchema;
		} else if (isNoOpCodec(node)) {
			result[key] = schemaNode;
		} else if (isArrayCodecShape(node)) {
			const itemSchema = getArrayItemSchema(schemaNode);
			result[key] = z.array(
				buildOutputZodArrayItem(node.itemShape, itemSchema),
			);
		} else {
			const nestedObjectSchema = getNestedObjectSchema(schemaNode);
			result[key] = z.object(
				buildOutputZodShape(
					node as RuntimeCodecShape,
					nestedObjectSchema.shape,
				),
			);
		}
	}
	return result;
}
function convertFromInput(
	shape: RuntimeCodecShape,
	data: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key in shape) {
		const node = shape[key];
		if (isCodec(node)) {
			result[key] = node.fromInput(data[key]);
		} else if (isNoOpCodec(node)) {
			result[key] = data[key];
		} else if (isArrayCodecShape(node)) {
			const value = data[key];
			result[key] = Array.isArray(value)
				? value.map((item) => convertArrayItemFromInput(node.itemShape, item))
				: value;
		} else {
			result[key] = convertFromInput(
				node as RuntimeCodecShape,
				asRecord(data[key]),
			);
		}
	}
	return result;
}

function convertFromOutput(
	shape: RuntimeCodecShape,
	data: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key in shape) {
		const node = shape[key];
		if (isCodec(node)) {
			result[key] = node.fromOutput(data[key]);
		} else if (isNoOpCodec(node)) {
			result[key] = data[key];
		} else if (isArrayCodecShape(node)) {
			const value = data[key];
			result[key] = Array.isArray(value)
				? value.map((item) => convertArrayItemFromOutput(node.itemShape, item))
				: value;
		} else {
			result[key] = convertFromOutput(
				node as RuntimeCodecShape,
				asRecord(data[key]),
			);
		}
	}

	return result;
}
export function buildAddaptersAndOutputSchema<
	TInputSchema extends z.AnyZodObject,
	const S extends RuntimeCodecShape,
>(
	inputSchema: TInputSchema,
	shape: S & CodecShapeForSchemaShape<SchemaShapeOf<TInputSchema>>,
) {
	const outputSchema = z.object(
		buildOutputZodShape(
			shape as RuntimeCodecShape,
			inputSchema.shape as z.ZodRawShape,
		),
	) as z.ZodObject<
		OutputZodShapeForSchemaShape<SchemaShapeOf<TInputSchema>, S>
	>;

	type InputType = z.infer<TInputSchema>;
	type OutputType = z.infer<typeof outputSchema>;

	const fromInput = (data: InputType): OutputType => {
		return convertFromInput(
			shape as RuntimeCodecShape,
			data as Record<string, unknown>,
		) as OutputType;
	};

	const fromOutput = (data: OutputType): InputType => {
		return convertFromOutput(
			shape as RuntimeCodecShape,
			data as Record<string, unknown>,
		) as InputType;
	};

	return {
		outputSchema,
		fromInput,
		fromOutput,
	};
}
