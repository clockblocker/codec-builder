/** biome-ignore-all lint/suspicious/noExplicitAny: library */
import { z } from "zod";
import {
	buildOutputZodArrayItemLoose,
	convertArrayItemFromInputLoose,
	convertArrayItemFromOutputLoose,
} from "./loose-adapter-builder";
import {
	type ArrayCodecShape,
	asRecord,
	type Codec,
	isArrayCodecShape,
	isCodec,
	isNoOpCodec,
	type KnownKeys,
	noOpCodec,
	type OutputZodArrayItemFromCodecNode,
	type RuntimeCodecShape,
	type SchemaShapeOf,
	tryGetArrayItemSchema,
	tryGetNestedObjectSchema,
	unwrapOptionalNullableSchema,
} from "./strict-adapter-builder";

interface FromPathCodecShape<
	TPath extends string = string,
	TNode extends RuntimeEvenLooserBaseNode = RuntimeEvenLooserBaseNode,
> {
	readonly __fromPathCodecShape: true;
	readonly path: TPath;
	readonly node: TNode;
}

interface FromPathsCodecShape<
	TPaths extends readonly string[] = readonly string[],
	TCodec extends Codec<any, any, any> = Codec<any, any, any>,
> {
	readonly __fromPathsCodecShape: true;
	readonly paths: TPaths;
	readonly codec: TCodec;
}

interface RemoveFieldCodec {
	readonly __removeFieldCodec: true;
}

export const removeField = {
	__removeFieldCodec: true,
} as const satisfies RemoveFieldCodec;

type RuntimeEvenLooserBaseNode =
	| RuntimeCodecShape
	| Codec<any, any, any>
	| typeof noOpCodec
	| ArrayCodecShape;

type RuntimeEvenLooserShapeNode =
	| RuntimeEvenLooserBaseNode
	| FromPathCodecShape
	| FromPathsCodecShape
	| RemoveFieldCodec;

type RuntimeEvenLooserShape = Record<string, RuntimeEvenLooserShapeNode>;
export type ReshapeShapeFor<TInputSchema extends z.AnyZodObject> =
	TInputSchema extends z.AnyZodObject ? RuntimeEvenLooserShape : never;

type PathInput = string | readonly string[];

type JoinPathTuple<TTokens extends readonly string[]> =
	TTokens extends readonly [
		infer THead extends string,
		...infer TRest extends readonly string[],
	]
		? TRest extends []
			? THead
			: `${THead}.${JoinPathTuple<TRest>}`
		: never;

type PathStringFromInput<TPath extends PathInput> = TPath extends string
	? TPath
	: JoinPathTuple<Extract<TPath, readonly string[]>>;

type NormalizePathInputs<TPaths extends readonly PathInput[]> =
	TPaths extends readonly [
		infer THead extends PathInput,
		...infer TRest extends readonly PathInput[],
	]
		? [PathStringFromInput<THead>, ...NormalizePathInputs<TRest>]
		: [];

type UnwrapOptionalNullableSchema<TSchema extends z.ZodTypeAny> =
	TSchema extends z.ZodOptional<infer TInner>
		? UnwrapOptionalNullableSchema<TInner>
		: TSchema extends z.ZodNullable<infer TInner>
			? UnwrapOptionalNullableSchema<TInner>
			: TSchema;

type PathDepth = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type PreviousPathDepth = {
	0: 0;
	1: 0;
	2: 1;
	3: 2;
	4: 3;
	5: 4;
	6: 5;
};

type NormalizePath<TPath extends string> =
	TPath extends `${infer THead}[${infer TIndex}]${infer TTail}`
		? NormalizePath<`${THead}.${TIndex}${TTail}`>
		: TPath;

type SplitPath<TPath extends string> =
	TPath extends `${infer THead}.${infer TTail}`
		? [THead, ...SplitPath<TTail>]
		: TPath extends ""
			? []
			: [TPath];

export type SchemaPathTuple<
	TSchema extends z.ZodTypeAny,
	TDepth extends PathDepth = 6,
> = [TDepth] extends [0]
	? []
	: UnwrapOptionalNullableSchema<TSchema> extends z.AnyZodObject
		? {
				[K in keyof UnwrapOptionalNullableSchema<TSchema>["shape"] &
					string]:
					| [K]
					| [
							K,
							...SchemaPathTuple<
								UnwrapOptionalNullableSchema<TSchema>["shape"][K],
								PreviousPathDepth[TDepth]
							>,
					  ];
			}[keyof UnwrapOptionalNullableSchema<TSchema>["shape"] & string]
		: UnwrapOptionalNullableSchema<TSchema> extends z.ZodArray<infer TItem, any>
			? [
					`${number}`,
					...SchemaPathTuple<TItem, PreviousPathDepth[TDepth]>,
			  ]
			: [];

type SchemaLeafPathTuple<
	TSchema extends z.ZodTypeAny,
	TDepth extends PathDepth = 6,
> = [TDepth] extends [0]
	? []
	: UnwrapOptionalNullableSchema<TSchema> extends z.AnyZodObject
		? {
				[K in keyof UnwrapOptionalNullableSchema<TSchema>["shape"] &
					string]: UnwrapOptionalNullableSchema<
					UnwrapOptionalNullableSchema<TSchema>["shape"][K]
				> extends z.AnyZodObject | z.ZodArray<any, any>
					? [K, ...SchemaLeafPathTuple<
							UnwrapOptionalNullableSchema<TSchema>["shape"][K],
							PreviousPathDepth[TDepth]
					  >]
					: [K];
			}[keyof UnwrapOptionalNullableSchema<TSchema>["shape"] & string]
		: UnwrapOptionalNullableSchema<TSchema> extends z.ZodArray<infer TItem, any>
			? UnwrapOptionalNullableSchema<TItem> extends z.AnyZodObject | z.ZodArray<any, any>
				? [`${number}`, ...SchemaLeafPathTuple<TItem, PreviousPathDepth[TDepth]>]
				: [`${number}`]
			: [];

type SchemaAtPathTokens<
	TSchema extends z.ZodTypeAny,
	TTokens extends readonly string[],
> = TTokens extends [
	infer THead extends string,
	...infer TRest extends string[],
]
	? UnwrapOptionalNullableSchema<TSchema> extends z.AnyZodObject
		? THead extends keyof UnwrapOptionalNullableSchema<TSchema>["shape"]
			? SchemaAtPathTokens<
					UnwrapOptionalNullableSchema<TSchema>["shape"][THead],
					TRest
				>
			: never
		: UnwrapOptionalNullableSchema<TSchema> extends z.ZodArray<infer TItem, any>
			? THead extends `${number}`
				? SchemaAtPathTokens<TItem, TRest>
				: never
			: never
	: TSchema;

type SchemaAtPath<
	TInputSchema extends z.AnyZodObject,
	TPath extends string,
> = SchemaAtPathTokens<TInputSchema, SplitPath<NormalizePath<TPath>>>;

type SchemaAtTuplePath<
	TInputSchema extends z.AnyZodObject,
	TPath extends readonly string[],
> = SchemaAtPathTokens<TInputSchema, TPath>;

type InputAtTuplePath<
	TInputSchema extends z.AnyZodObject,
	TPath extends readonly string[],
> =
	SchemaAtTuplePath<TInputSchema, TPath> extends z.ZodTypeAny
		? z.input<SchemaAtTuplePath<TInputSchema, TPath>>
		: unknown;

type InputTupleForPaths<
	TInputSchema extends z.AnyZodObject,
	TPaths extends readonly (readonly string[])[],
> = {
	[K in keyof TPaths]: TPaths[K] extends readonly string[]
		? InputAtTuplePath<TInputSchema, TPaths[K]>
		: never;
};

type SchemaAtPathOrUnknown<
	TInputSchema extends z.AnyZodObject,
	TPath extends string,
> =
	SchemaAtPath<TInputSchema, TPath> extends z.ZodTypeAny
		? SchemaAtPath<TInputSchema, TPath>
		: z.ZodUnknown;

type RemoveFieldShapeKeys<S extends RuntimeEvenLooserShape> = {
	[K in KnownKeys<S>]: S[K] extends RemoveFieldCodec ? K : never;
}[KnownKeys<S>];

type ExplicitEvenLooserShapeKeys<S extends RuntimeEvenLooserShape> = Exclude<
	KnownKeys<S>,
	RemoveFieldShapeKeys<S>
>;

type InputSchemaUntouchedShape<
	TInputSchema extends z.AnyZodObject,
	S extends RuntimeEvenLooserShape,
> = {
	[K in Exclude<KnownKeys<SchemaShapeOf<TInputSchema>>, KnownKeys<S>>]:
		SchemaShapeOf<TInputSchema>[K];
};

type EvenLooserOutputZodNodeBase<
	TInputSchema extends z.AnyZodObject,
	TInputFieldSchema,
	TNode extends RuntimeEvenLooserBaseNode,
> =
	TNode extends Codec<any, any, infer TSchema>
		? TSchema
		: TNode extends typeof noOpCodec
			? TInputFieldSchema extends z.ZodTypeAny
				? TInputFieldSchema
				: z.ZodUnknown
			: TNode extends ArrayCodecShape<infer TItemShape>
				? z.ZodArray<OutputZodArrayItemFromCodecNode<TItemShape>>
				: TNode extends RuntimeEvenLooserShape
					? z.ZodObject<
							EvenLooserOutputZodShapeForInput<TInputSchema, TNode, false>
						>
					: never;

type EvenLooserOutputZodNode<
	TInputSchema extends z.AnyZodObject,
	TInputFieldSchema,
	TShapeNode extends RuntimeEvenLooserShapeNode,
> =
	TShapeNode extends FromPathCodecShape<infer TPath, infer TNode>
		? TNode extends typeof noOpCodec
			? SchemaAtPathOrUnknown<TInputSchema, TPath>
			: EvenLooserOutputZodNodeBase<TInputSchema, never, TNode>
		: TShapeNode extends FromPathsCodecShape<any, infer TCodec>
			? TCodec extends Codec<any, any, infer TSchema>
				? TSchema
				: never
			: TShapeNode extends RemoveFieldCodec
				? never
			: TShapeNode extends RuntimeEvenLooserBaseNode
				? EvenLooserOutputZodNodeBase<
						TInputSchema,
						TInputFieldSchema,
						TShapeNode
					>
				: never;

type EvenLooserOutputZodShapeForInput<
	TInputSchema extends z.AnyZodObject,
	S extends RuntimeEvenLooserShape,
	TIncludeUnspecifiedInputKeys extends boolean,
> = (TIncludeUnspecifiedInputKeys extends true
	? InputSchemaUntouchedShape<TInputSchema, S>
	: {}) & {
	[K in ExplicitEvenLooserShapeKeys<S>]: EvenLooserOutputZodNode<
		TInputSchema,
		K extends keyof SchemaShapeOf<TInputSchema>
			? SchemaShapeOf<TInputSchema>[K]
			: never,
		S[K]
	>;
};

export function fromPath<
	const TPath extends string,
	const TNode extends RuntimeEvenLooserBaseNode = typeof noOpCodec,
>(path: TPath, node?: TNode): FromPathCodecShape<TPath, TNode>;
export function fromPath<
	const TPath extends readonly string[],
	const TNode extends RuntimeEvenLooserBaseNode = typeof noOpCodec,
>(path: TPath, node?: TNode): FromPathCodecShape<JoinPathTuple<TPath>, TNode>;
export function fromPath<
	const TPath extends PathInput,
	const TNode extends RuntimeEvenLooserBaseNode = typeof noOpCodec,
>(path: TPath, node?: TNode): FromPathCodecShape<PathStringFromInput<TPath>, TNode> {
	return {
		__fromPathCodecShape: true,
		path: normalizePathInput(path),
		node: (node ?? noOpCodec) as TNode,
	} as FromPathCodecShape<PathStringFromInput<TPath>, TNode>;
}

export function fromPaths<
	const TPaths extends readonly string[],
	const TCodec extends Codec<any, any, any>,
>(paths: TPaths, codec: TCodec): FromPathsCodecShape<TPaths, TCodec>;
export function fromPaths<
	const TPaths extends readonly (readonly string[])[],
	const TCodec extends Codec<any, any, any>,
>(
	paths: TPaths,
	codec: TCodec,
): FromPathsCodecShape<NormalizePathInputs<TPaths>, TCodec>;
export function fromPaths<
	const TPaths extends readonly PathInput[],
	const TCodec extends Codec<any, any, any>,
>(paths: TPaths, codec: TCodec): FromPathsCodecShape<NormalizePathInputs<TPaths>, TCodec> {
	return {
		__fromPathsCodecShape: true,
		paths: paths.map((path) => normalizePathInput(path)) as NormalizePathInputs<TPaths>,
		codec,
	} as FromPathsCodecShape<NormalizePathInputs<TPaths>, TCodec>;
}
function isFromPathCodecShape(v: unknown): v is FromPathCodecShape {
	return (
		typeof v === "object" &&
		v !== null &&
		"__fromPathCodecShape" in v &&
		(v as FromPathCodecShape).__fromPathCodecShape === true &&
		"path" in v &&
		"node" in v
	);
}

function isFromPathsCodecShape(v: unknown): v is FromPathsCodecShape {
	return (
		typeof v === "object" &&
		v !== null &&
		"__fromPathsCodecShape" in v &&
		(v as FromPathsCodecShape).__fromPathsCodecShape === true &&
		"paths" in v &&
		"codec" in v
	);
}

function isRemoveFieldCodec(v: unknown): v is RemoveFieldCodec {
	return (
		typeof v === "object" &&
		v !== null &&
		"__removeFieldCodec" in v &&
		(v as RemoveFieldCodec).__removeFieldCodec === true
	);
}

function normalizePathInput(path: PathInput): string {
	if (Array.isArray(path)) {
		return path.join(".");
	}

	return path as string;
}

function pathTokens(path: string): string[] {
	return path.match(/[^.[\]]+/g) ?? [];
}

function topLevelPathKey(path: string): string | undefined {
	const [firstToken] = pathTokens(path);
	return firstToken;
}

function isNumericPathToken(token: string): boolean {
	return /^\d+$/.test(token);
}

function getValueAtPath(data: unknown, path: string): unknown {
	let current: unknown = data;
	for (const token of pathTokens(path)) {
		if (current === null || current === undefined) {
			return undefined;
		}

		if (Array.isArray(current)) {
			const index = Number(token);
			current = Number.isInteger(index) ? current[index] : undefined;
			continue;
		}

		if (typeof current !== "object") {
			return undefined;
		}

		current = (current as Record<string, unknown>)[token];
	}

	return current;
}

function setValueAtPath(
	data: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const tokens = pathTokens(path);
	if (tokens.length === 0) {
		return;
	}

	let current: unknown = data;
	for (let index = 0; index < tokens.length - 1; index++) {
		const token = tokens[index];
		const nextToken = tokens[index + 1];
		if (!token || !nextToken) {
			return;
		}
		const key: string | number = isNumericPathToken(token)
			? Number(token)
			: token;
		const nextContainerIsArray = isNumericPathToken(nextToken);

		if (!Array.isArray(current) && typeof current !== "object") {
			return;
		}

		const parent = current as Record<string | number, unknown>;
		const existing = parent[key];
		if (
			existing === null ||
			existing === undefined ||
			typeof existing !== "object"
		) {
			parent[key] = nextContainerIsArray ? [] : {};
		}
		current = parent[key];
	}

	const lastToken = tokens[tokens.length - 1];
	if (!lastToken) {
		return;
	}
	const lastKey: string | number = isNumericPathToken(lastToken)
		? Number(lastToken)
		: lastToken;

	if (!Array.isArray(current) && typeof current !== "object") {
		return;
	}

	(current as Record<string | number, unknown>)[lastKey] = value;
}

function getSchemaAtPath(
	schema: z.ZodTypeAny,
	path: string,
): z.ZodTypeAny | undefined {
	let current: z.ZodTypeAny | undefined = schema;
	for (const token of pathTokens(path)) {
		if (!current) {
			return undefined;
		}

		const unwrapped = unwrapOptionalNullableSchema(current);
		if (unwrapped instanceof z.ZodObject) {
			current = unwrapped.shape[token];
			continue;
		}

		if (unwrapped instanceof z.ZodArray) {
			if (!isNumericPathToken(token)) {
				return undefined;
			}
			current = unwrapped.element;
			continue;
		}

		return undefined;
	}

	return current;
}
function buildOutputZodNodeEvenLooserBase(
	node: RuntimeEvenLooserBaseNode,
	schemaNode: z.ZodTypeAny | undefined,
	inputSchema: z.AnyZodObject,
	includeUnspecifiedInputKeys?: boolean,
): z.ZodTypeAny {
	if (isCodec(node)) {
		return node.outputSchema;
	}

	if (isNoOpCodec(node)) {
		return schemaNode ?? z.unknown();
	}

	if (isArrayCodecShape(node)) {
		const itemSchema = tryGetArrayItemSchema(schemaNode);
		return z.array(buildOutputZodArrayItemLoose(node.itemShape, itemSchema));
	}

	const nestedObjectSchema = tryGetNestedObjectSchema(schemaNode);
	return z.object(
		buildOutputZodShapeEvenLooser(
			node as RuntimeEvenLooserShape,
			inputSchema,
			nestedObjectSchema?.shape,
			includeUnspecifiedInputKeys,
		),
	);
}

function buildOutputZodShapeEvenLooser(
	shape: RuntimeEvenLooserShape,
	inputSchema: z.AnyZodObject,
	schemaShape?: z.ZodRawShape,
	includeUnspecifiedInputKeys?: boolean,
): Record<string, z.ZodTypeAny> {
	const result: Record<string, z.ZodTypeAny> = {};

	for (const key in shape) {
		const node = shape[key];
		if (!node) {
			continue;
		}
		if (isRemoveFieldCodec(node)) {
			continue;
		}
		const schemaNode = schemaShape?.[key];
		if (isFromPathCodecShape(node)) {
			const sourceSchema = getSchemaAtPath(inputSchema, node.path);
			result[key] = buildOutputZodNodeEvenLooserBase(
				node.node,
				sourceSchema,
				inputSchema,
				includeUnspecifiedInputKeys,
			);
			continue;
		}

		if (isFromPathsCodecShape(node)) {
			result[key] = node.codec.outputSchema;
			continue;
		}

		result[key] = buildOutputZodNodeEvenLooserBase(
			node,
			schemaNode,
			inputSchema,
			includeUnspecifiedInputKeys,
		);
	}

	if (includeUnspecifiedInputKeys && schemaShape) {
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

function convertNodeFromInputEvenLooserBase(
	node: RuntimeEvenLooserBaseNode,
	value: unknown,
	options: { includeUnspecifiedInputKeys?: boolean },
	rootInput: Record<string, unknown>,
): unknown {
	if (isCodec(node)) {
		return node.fromInput(value);
	}

	if (isNoOpCodec(node)) {
		return value;
	}

	if (isArrayCodecShape(node)) {
		return Array.isArray(value)
			? value.map((item) =>
					convertArrayItemFromInputLoose(node.itemShape, item),
				)
			: value;
	}

	return convertFromInputEvenLooser(
		node as RuntimeEvenLooserShape,
		asRecord(value),
		options,
		rootInput,
	);
}

function convertNodeFromOutputEvenLooserBase(
	node: RuntimeEvenLooserBaseNode,
	value: unknown,
	options: { includeUnspecifiedInputKeys?: boolean },
	rootResult: Record<string, unknown>,
): unknown {
	if (isCodec(node)) {
		return node.fromOutput(value);
	}

	if (isNoOpCodec(node)) {
		return value;
	}

	if (isArrayCodecShape(node)) {
		return Array.isArray(value)
			? value.map((item) =>
					convertArrayItemFromOutputLoose(node.itemShape, item),
				)
			: value;
	}

	return convertFromOutputEvenLooser(
		node as RuntimeEvenLooserShape,
		asRecord(value),
		options,
		rootResult,
	);
}

function convertFromInputEvenLooser(
	shape: RuntimeEvenLooserShape,
	data: Record<string, unknown>,
	options: { includeUnspecifiedInputKeys?: boolean },
	rootInput: Record<string, unknown> = data,
): Record<string, unknown> {
	const result: Record<string, unknown> = options.includeUnspecifiedInputKeys
		? { ...data }
		: {};

	for (const key in shape) {
		const node = shape[key];
		if (!node) {
			continue;
		}
		if (isRemoveFieldCodec(node)) {
			delete result[key];
			continue;
		}
		if (isFromPathCodecShape(node)) {
			const sourceValue = getValueAtPath(rootInput, node.path);
			result[key] = convertNodeFromInputEvenLooserBase(
				node.node,
				sourceValue,
				options,
				rootInput,
			);
			continue;
		}

		if (isFromPathsCodecShape(node)) {
			const sourceValues = node.paths.map((path) =>
				getValueAtPath(rootInput, path),
			);
			result[key] = node.codec.fromInput(sourceValues);
			continue;
		}

		result[key] = convertNodeFromInputEvenLooserBase(
			node,
			data[key],
			options,
			rootInput,
		);
	}

	return result;
}

function convertFromOutputEvenLooser(
	shape: RuntimeEvenLooserShape,
	data: Record<string, unknown>,
	options: { includeUnspecifiedInputKeys?: boolean },
	rootResult?: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = options.includeUnspecifiedInputKeys
		? { ...data }
		: {};
	const rootTarget = rootResult ?? result;
	const writtenTopLevelKeys = new Set<string>();

	for (const key in shape) {
		const node = shape[key];
		if (!node) {
			continue;
		}
		if (isRemoveFieldCodec(node)) {
			if (!writtenTopLevelKeys.has(key)) {
				delete result[key];
			}
			continue;
		}
		delete result[key];

		if (isFromPathCodecShape(node)) {
			const sourceValue = convertNodeFromOutputEvenLooserBase(
				node.node,
				data[key],
				options,
				rootTarget,
			);
			setValueAtPath(rootTarget, node.path, sourceValue);
			const topLevelKey = topLevelPathKey(node.path);
			if (topLevelKey) {
				writtenTopLevelKeys.add(topLevelKey);
			}
			continue;
		}

		if (isFromPathsCodecShape(node)) {
			const sourceValues = node.codec.fromOutput(data[key]);
			if (
				!Array.isArray(sourceValues) ||
				sourceValues.length !== node.paths.length
			) {
				throw new Error(
					`fromPaths mapping for "${key}" must decode to an array with ${node.paths.length} item(s).`,
				);
			}

			node.paths.forEach((path, index) => {
				setValueAtPath(rootTarget, path, sourceValues[index]);
				const topLevelKey = topLevelPathKey(path);
				if (topLevelKey) {
					writtenTopLevelKeys.add(topLevelKey);
				}
			});
			continue;
		}

		result[key] = convertNodeFromOutputEvenLooserBase(
			node,
			data[key],
			options,
			rootTarget,
		);
		if (
			typeof result[key] === "object" &&
			result[key] !== null &&
			!Array.isArray(result[key]) &&
			!isShapeWithLocalFromOutputFields(node as RuntimeEvenLooserShape)
		) {
			delete result[key];
		}
	}

	return result;
}

function isShapeWithLocalFromOutputFields(
	shape: RuntimeEvenLooserShape,
): boolean {
	for (const key in shape) {
		const node = shape[key];
		if (!node) {
			continue;
		}

		if (isFromPathCodecShape(node) || isFromPathsCodecShape(node)) {
			continue;
		}
		if (isRemoveFieldCodec(node)) {
			continue;
		}

		if (isCodec(node) || isNoOpCodec(node) || isArrayCodecShape(node)) {
			return true;
		}

		if (isShapeWithLocalFromOutputFields(node as RuntimeEvenLooserShape)) {
			return true;
		}
	}

	return false;
}
export function buildEvenLooserAddaptersAndOutputSchema<
	TInputSchema extends z.AnyZodObject,
	const S extends RuntimeEvenLooserShape,
	const TIncludeUnspecifiedInputKeys extends boolean = true,
>(
	inputSchema: TInputSchema,
	shape: S,
	options?: {
		includeUnspecifiedInputKeys?: TIncludeUnspecifiedInputKeys;
	},
) {
	const includeUnspecifiedInputKeys =
		options?.includeUnspecifiedInputKeys ?? true;
	const outputSchema = z.object(
		buildOutputZodShapeEvenLooser(
			shape as RuntimeEvenLooserShape,
			inputSchema,
			inputSchema.shape as z.ZodRawShape,
			includeUnspecifiedInputKeys,
		),
	) as z.ZodObject<
		EvenLooserOutputZodShapeForInput<
			TInputSchema,
			S,
			TIncludeUnspecifiedInputKeys
		>
	>;

	type InputType = z.infer<TInputSchema>;
	type OutputType = z.infer<typeof outputSchema>;

	const fromInput = (data: InputType): OutputType => {
		return convertFromInputEvenLooser(
			shape as RuntimeEvenLooserShape,
			data as Record<string, unknown>,
			{ includeUnspecifiedInputKeys },
		) as OutputType;
	};

	const fromOutput = (data: OutputType): InputType => {
		return convertFromOutputEvenLooser(
			shape as RuntimeEvenLooserShape,
			data as Record<string, unknown>,
			{ includeUnspecifiedInputKeys },
		) as InputType;
	};

	return {
		outputSchema,
		fromInput,
		fromOutput,
	};
}

export function reshapeFor<TInputSchema extends z.AnyZodObject>(
	inputSchema: TInputSchema,
) {
	return {
		fromPath: <
			const TPath extends SchemaPathTuple<TInputSchema>,
			const TNode extends RuntimeEvenLooserBaseNode = typeof noOpCodec,
		>(
			path: TPath,
			node?: TNode,
		) => fromPath(path, node),
		fromPaths: <
			const TPaths extends readonly SchemaLeafPathTuple<TInputSchema>[],
			const TCodec extends Codec<
				any,
				InputTupleForPaths<TInputSchema, TPaths>,
				any
			>,
		>(
			paths: TPaths,
			codec: TCodec,
		) => fromPaths(paths, codec),
		removeField,
		build: <
			const S extends RuntimeEvenLooserShape,
			const TIncludeUnspecifiedInputKeys extends boolean = true,
		>(
			shape: S,
			options?: {
				includeUnspecifiedInputKeys?: TIncludeUnspecifiedInputKeys;
			},
		) => buildEvenLooserAddaptersAndOutputSchema(inputSchema, shape, options),
	} as const;
}
