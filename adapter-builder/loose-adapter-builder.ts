/** biome-ignore-all lint/suspicious/noExplicitAny: library */
import { z } from "zod";
import {
	type ArrayCodecShape,
	type ArrayItemObjectOutput,
	type ArrayItemSchemaOf,
	type ArrayItemSchemaShape,
	asRecord,
	type Codec,
	type IsWideZodType,
	isArrayCodecShape,
	isCodec,
	isNoOpCodec,
	type KnownKeys,
	type NestedSchemaShape,
	type NoOpCodec,
	type ObjectOutput,
	type OutputZodArrayItemFromCodecNode,
	type OutputZodShapeFromCodecShape,
	type OutputZodShapeFromOutputObject,
	type RuntimeArrayItemShape,
	type RuntimeCodecShape,
	type SchemaShapeOf,
	tryGetArrayItemSchema,
	tryGetNestedObjectSchema,
} from "./strict-adapter-builder";

type LooseOutputZodArrayItemForInputField<
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
						: z.ZodObject<OutputZodShapeFromCodecShape<TItemShape>>
					: z.ZodObject<
							LooseOutputZodShapeForSchemaShape<
								ArrayItemSchemaShape<TInputField>,
								TItemShape
							>
						>
				: never;

type LooseOutputZodNodeForField<TInputField extends z.ZodTypeAny, TShapeNode> =
	TShapeNode extends Codec<any, any, infer TSchema>
		? TSchema
		: TShapeNode extends NoOpCodec
			? TInputField
			: TShapeNode extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<
						LooseOutputZodArrayItemForInputField<TInputField, TItemShape>
					>
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
							: z.ZodObject<OutputZodShapeFromCodecShape<TShapeNode>>
						: z.ZodObject<
								LooseOutputZodShapeForSchemaShape<
									NestedSchemaShape<TInputField>,
									TShapeNode
								>
							>
					: never;

type LooseOutputZodNodeWithoutInput<TShapeNode> =
	TShapeNode extends Codec<any, any, infer TSchema>
		? TSchema
		: TShapeNode extends NoOpCodec
			? z.ZodUnknown
			: TShapeNode extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<OutputZodArrayItemFromCodecNode<TItemShape>>
				: TShapeNode extends RuntimeCodecShape
					? z.ZodObject<OutputZodShapeFromCodecShape<TShapeNode>>
					: never;

type LooseUnspecifiedSchemaKeysShape<
	TShape extends z.ZodRawShape,
	S extends RuntimeCodecShape,
> = {
	[K in Exclude<keyof TShape, KnownKeys<S>>]: TShape[K];
};

type LooseOutputZodShapeForSchemaShape<
	TShape extends z.ZodRawShape,
	S extends RuntimeCodecShape,
> = LooseUnspecifiedSchemaKeysShape<TShape, S> & {
	[K in KnownKeys<S>]: K extends keyof TShape
		? TShape[K] extends z.ZodTypeAny
			? LooseOutputZodNodeForField<TShape[K], S[K]>
			: never
		: LooseOutputZodNodeWithoutInput<S[K]>;
};
export function buildOutputZodArrayItemLoose(
	itemShape: RuntimeArrayItemShape,
	itemSchema: z.ZodTypeAny | null,
): z.ZodTypeAny {
	if (isCodec(itemShape)) {
		return itemShape.outputSchema;
	}

	if (isNoOpCodec(itemShape)) {
		return itemSchema ?? z.unknown();
	}

	const nestedObjectSchema = tryGetNestedObjectSchema(itemSchema ?? undefined);
	return z.object(
		buildOutputZodShapeLoose(
			itemShape as RuntimeCodecShape,
			nestedObjectSchema?.shape,
		),
	);
}
function buildOutputZodShapeLoose(
	shape: RuntimeCodecShape,
	schemaShape?: z.ZodRawShape,
): Record<string, z.ZodTypeAny> {
	const result: Record<string, z.ZodTypeAny> = {};
	for (const key in shape) {
		const node = shape[key];
		const schemaNode = schemaShape?.[key];

		if (isCodec(node)) {
			result[key] = node.outputSchema;
			continue;
		}

		if (isNoOpCodec(node)) {
			result[key] = schemaNode ?? z.unknown();
			continue;
		}

		if (isArrayCodecShape(node)) {
			const itemSchema = tryGetArrayItemSchema(schemaNode);
			result[key] = z.array(
				buildOutputZodArrayItemLoose(node.itemShape, itemSchema),
			);
			continue;
		}

		const nestedObjectSchema = tryGetNestedObjectSchema(schemaNode);
		result[key] = z.object(
			buildOutputZodShapeLoose(
				node as RuntimeCodecShape,
				nestedObjectSchema?.shape,
			),
		);
	}

	if (schemaShape) {
		for (const key in schemaShape) {
			if (key in shape) {
				continue;
			}
			const schemaNode = schemaShape[key];
			if (schemaNode) {
				result[key] = schemaNode;
			}
		}
	}

	return result;
}
export function convertArrayItemFromInputLoose(
	itemShape: RuntimeArrayItemShape,
	item: unknown,
): unknown {
	if (isCodec(itemShape)) {
		return itemShape.fromInput(item);
	}

	if (isNoOpCodec(itemShape)) {
		return item;
	}

	return convertFromInputLoose(itemShape as RuntimeCodecShape, asRecord(item));
}

export function convertArrayItemFromOutputLoose(
	itemShape: RuntimeArrayItemShape,
	item: unknown,
): unknown {
	if (isCodec(itemShape)) {
		return itemShape.fromOutput(item);
	}

	if (isNoOpCodec(itemShape)) {
		return item;
	}

	return convertFromOutputLoose(itemShape as RuntimeCodecShape, asRecord(item));
}

function convertFromInputLoose(
	shape: RuntimeCodecShape,
	data: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...data };
	for (const key in shape) {
		const node = shape[key];
		if (isCodec(node)) {
			result[key] = node.fromInput(data[key]);
		} else if (isNoOpCodec(node)) {
			result[key] = data[key];
		} else if (isArrayCodecShape(node)) {
			const value = data[key];
			result[key] = Array.isArray(value)
				? value.map((item) =>
						convertArrayItemFromInputLoose(node.itemShape, item),
					)
				: value;
		} else {
			result[key] = convertFromInputLoose(
				node as RuntimeCodecShape,
				asRecord(data[key]),
			);
		}
	}
	return result;
}

function convertFromOutputLoose(
	shape: RuntimeCodecShape,
	data: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...data };
	for (const key in shape) {
		const node = shape[key];
		if (isCodec(node)) {
			result[key] = node.fromOutput(data[key]);
		} else if (isNoOpCodec(node)) {
			result[key] = data[key];
		} else if (isArrayCodecShape(node)) {
			const value = data[key];
			result[key] = Array.isArray(value)
				? value.map((item) =>
						convertArrayItemFromOutputLoose(node.itemShape, item),
					)
				: value;
		} else {
			result[key] = convertFromOutputLoose(
				node as RuntimeCodecShape,
				asRecord(data[key]),
			);
		}
	}

	return result;
}
export function buildLooseAddaptersAndOutputSchema<
	TInputSchema extends z.AnyZodObject,
	const S extends RuntimeCodecShape,
>(inputSchema: TInputSchema, shape: S) {
	const outputSchema = z.object(
		buildOutputZodShapeLoose(
			shape as RuntimeCodecShape,
			inputSchema.shape as z.ZodRawShape,
		),
	) as z.ZodObject<
		LooseOutputZodShapeForSchemaShape<SchemaShapeOf<TInputSchema>, S>
	>;

	type InputType = z.infer<TInputSchema>;
	type OutputType = z.infer<typeof outputSchema>;

	const fromInput = (data: InputType): OutputType => {
		return convertFromInputLoose(
			shape as RuntimeCodecShape,
			data as Record<string, unknown>,
		) as OutputType;
	};

	const fromOutput = (data: OutputType): InputType => {
		return convertFromOutputLoose(
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
