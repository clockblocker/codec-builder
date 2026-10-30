import { Effect, Schema, SchemaGetter, SchemaIssue } from "effect";
import type { AnyStruct, Simplify } from "../core/types.js";

type FieldsOf<TSchema extends AnyStruct> = TSchema["fields"];

type SchemaKey<TSchema extends AnyStruct> = Extract<
	keyof FieldsOf<TSchema>,
	string
>;

type FixedFieldsFor<TSchema extends AnyStruct> = Partial<{
	[K in SchemaKey<TSchema>]: FieldsOf<TSchema>[K]["Encoded"];
}>;

type NoUnknownFixedFields<TSchema extends AnyStruct, TFixedFields> = Record<
	Exclude<keyof TFixedFields, SchemaKey<TSchema>>,
	never
>;

type ModelFields<
	TSchema extends AnyStruct,
	TFixedFields extends Record<string, unknown>,
> = Simplify<{
	readonly [K in Exclude<
		keyof FieldsOf<TSchema>,
		keyof TFixedFields
	>]: Schema.toEncoded<FieldsOf<TSchema>[K]>;
}>;

/**
 * Builds a codec from a smaller struct, without the fixed fields, to the
 * canonical struct. The canonical struct is the decoded side (`to`); `from`
 * holds the encoded side of the other fields.
 *
 * Fixed values are given in their encoded form and decoded with their field
 * schemas when the codec is built. Decode adds them before the canonical
 * struct decodes; encode fails with a schema issue on a fixed field that
 * differs from its configured value, then removes them.
 */
export function buildFixedFieldsCodec<
	TCanonicalSchema extends AnyStruct,
	const TFixedFields extends Record<string, unknown>,
>(
	canonicalSchema: TCanonicalSchema,
	fixedFields: TFixedFields &
		NoInfer<FixedFieldsFor<TCanonicalSchema>> &
		NoUnknownFixedFields<TCanonicalSchema, TFixedFields>,
): Schema.decodeTo<
	TCanonicalSchema,
	Schema.Struct<ModelFields<TCanonicalSchema, TFixedFields>>
> {
	const fields = canonicalSchema.fields as Record<string, Schema.Top>;

	// Each fixed value as the canonical struct encodes it, so encode compares
	// like with like ("1.0" and "1" are the same NumberFromString value).
	const encodedFixedFields: Record<string, unknown> = {};
	for (const [fieldName, fixedValue] of Object.entries(fixedFields)) {
		const fieldSchema = Object.hasOwn(fields, fieldName)
			? fields[fieldName]
			: undefined;
		if (fieldSchema === undefined) {
			throw new Error(
				`Cannot fix unknown field "${fieldName}" because it does not exist in the canonical schema.`,
			);
		}
		// Parsed synchronously, so a fixed field's schema must not need
		// services or async steps.
		const syncSchema = fieldSchema as Schema.Codec<unknown, unknown>;
		encodedFixedFields[fieldName] = Schema.encodeUnknownSync(syncSchema)(
			Schema.decodeUnknownSync(syncSchema)(fixedValue),
		);
	}

	const modelFields: Record<string, Schema.Top> = {};
	for (const [fieldName, fieldSchema] of Object.entries(fields)) {
		if (!Object.hasOwn(encodedFixedFields, fieldName)) {
			modelFields[fieldName] = Schema.toEncoded(fieldSchema);
		}
	}

	type Row = Record<string, unknown>;

	const encode = (canonicalValue: Row) => {
		const modelValue: Row = { ...canonicalValue };
		for (const [fieldName, expected] of Object.entries(
			encodedFixedFields,
		)) {
			if (!deeplyEqual(modelValue[fieldName], expected)) {
				return Effect.fail(
					new SchemaIssue.Pointer(
						[fieldName],
						new SchemaIssue.InvalidValue(
							{
								message: `Fixed field does not equal ${formatValue(expected)}`,
							},
							modelValue[fieldName],
						),
					),
				);
			}
			delete modelValue[fieldName];
		}
		return Effect.succeed(modelValue);
	};

	return Schema.Struct(modelFields).pipe(
		Schema.decodeTo(canonicalSchema, {
			decode: SchemaGetter.transform((modelValue: Row) => ({
				...modelValue,
				...encodedFixedFields,
			})),
			encode: SchemaGetter.transformEffect(encode),
		} as never),
	) as never;
}

function deeplyEqual(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) return true;
	if (left instanceof Date && right instanceof Date) {
		return left.getTime() === right.getTime();
	}
	if (Array.isArray(left) && Array.isArray(right)) {
		return (
			left.length === right.length &&
			left.every((value, index) => deeplyEqual(value, right[index]))
		);
	}
	if (!isRecord(left) || !isRecord(right)) return false;

	const leftKeys = Object.keys(left).sort();
	const rightKeys = Object.keys(right).sort();
	return (
		leftKeys.length === rightKeys.length &&
		leftKeys.every(
			(key, index) =>
				key === rightKeys[index] && deeplyEqual(left[key], right[key]),
		)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function formatValue(value: unknown): string {
	if (typeof value === "bigint") return `${value}n`;
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}
