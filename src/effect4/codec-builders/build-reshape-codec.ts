import { Schema, SchemaGetter } from "effect";
import type { AnyStruct, Simplify } from "../core/types.js";

/**
 * Adds `fieldName` (built by `construct` from the decoded source) and drops
 * `dropFields`, which `reconstruct` gives back on encode. The result is
 * `source.pipe(Schema.decodeTo(derived, ...))`: `from` is the source and `to`
 * the derived struct, whose fields are the type sides of the kept source
 * fields and of `fieldSchema`.
 */
export function buildReshapeCodec<
	TSource extends AnyStruct,
	const TFieldName extends string,
	TFieldSchema extends Schema.Top,
	const TDropFields extends readonly SourceKeys<TSource>[] = [],
>(
	source: TSource,
	config: ReshapeCodecConfig<TSource, TFieldName, TFieldSchema, TDropFields>,
): Schema.decodeTo<
	Schema.Struct<OutputFields<TSource, TFieldName, TFieldSchema, TDropFields>>,
	TSource
> {
	const { fieldName, fieldSchema, dropFields, construct, reconstruct } =
		config;
	const dropFieldSet = new Set<string>((dropFields ?? []) as string[]);

	if (Object.hasOwn(source.fields, fieldName)) {
		throw new Error(
			`Cannot add field "${fieldName}" because it already exists in the input schema.`,
		);
	}

	// The transformation hands over decoded values, so the derived struct
	// holds the type side of each field.
	const outputFields: Record<string, Schema.Top> = {};
	for (const [key, field] of Object.entries(source.fields)) {
		if (!dropFieldSet.has(key)) {
			outputFields[key] = Schema.toType(field as Schema.Top);
		}
	}
	outputFields[fieldName] = Schema.toType(fieldSchema);

	type Row = Record<string, unknown>;

	const decode = (data: Row): Row => {
		const result: Row = { ...data, [fieldName]: construct(data as never) };
		for (const dropField of dropFieldSet) {
			delete result[dropField];
		}
		return result;
	};

	const encode = (data: Row): Row => {
		const result: Row = {
			...data,
			...(reconstruct(data[fieldName] as never, data as never) as Row),
		};
		delete result[fieldName];
		return result;
	};

	return source.pipe(
		Schema.decodeTo(Schema.Struct(outputFields), {
			decode: SchemaGetter.transform(decode),
			encode: SchemaGetter.transform(encode),
		} as never),
	) as never;
}

// -- Internals --

type IsTuple<T extends readonly unknown[]> = number extends T["length"]
	? false
	: true;

type SourceKeys<TSource extends AnyStruct> = Extract<
	keyof TSource["fields"],
	string
>;

type TypeSideFields<F extends Schema.Struct.Fields> = {
	readonly [K in keyof F]: Schema.toType<F[K]>;
};

type OutputFields<
	TSource extends AnyStruct,
	TFieldName extends string,
	TFieldSchema extends Schema.Top,
	TDropFields extends readonly SourceKeys<TSource>[],
> = Simplify<
	IsTuple<TDropFields> extends true
		? Omit<TypeSideFields<TSource["fields"]>, TDropFields[number]> & {
				readonly [K in TFieldName]: Schema.toType<TFieldSchema>;
			}
		: TypeSideFields<TSource["fields"]> & {
				readonly [K in TFieldName]: Schema.toType<TFieldSchema>;
			}
>;

type SourceType<TSource extends AnyStruct> = TSource["Type"];

type OutputWithAddedField<
	TSource extends AnyStruct,
	TFieldName extends string,
	TFieldSchema extends Schema.Top,
	TDropFields extends readonly SourceKeys<TSource>[],
> =
	IsTuple<TDropFields> extends true
		? Omit<SourceType<TSource>, TDropFields[number]> &
				Record<TFieldName, TFieldSchema["Type"]>
		: Partial<Pick<SourceType<TSource>, TDropFields[number]>> &
				Partial<Omit<SourceType<TSource>, TDropFields[number]>> &
				Record<TFieldName, TFieldSchema["Type"]>;

type ReconstructedInputWithDroppedFields<
	TSource extends AnyStruct,
	TDropFields extends readonly SourceKeys<TSource>[],
> =
	IsTuple<TDropFields> extends true
		? Required<Pick<SourceType<TSource>, TDropFields[number]>> &
				Partial<Omit<SourceType<TSource>, TDropFields[number]>>
		: Partial<SourceType<TSource>>;

type ReshapeCodecConfig<
	TSource extends AnyStruct,
	TFieldName extends string,
	TFieldSchema extends Schema.Top,
	TDropFields extends readonly SourceKeys<TSource>[],
> = {
	fieldName: TFieldName;
	fieldSchema: TFieldSchema;
	dropFields?: TDropFields;
	construct: (input: SourceType<TSource>) => TFieldSchema["Type"];
	reconstruct: (
		fieldValue: TFieldSchema["Type"],
		output: OutputWithAddedField<
			TSource,
			TFieldName,
			TFieldSchema,
			TDropFields
		>,
	) => ReconstructedInputWithDroppedFields<TSource, TDropFields>;
};
