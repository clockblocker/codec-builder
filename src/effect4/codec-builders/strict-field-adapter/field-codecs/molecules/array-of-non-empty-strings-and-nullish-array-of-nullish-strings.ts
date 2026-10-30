import { Option, Schema, SchemaGetter } from "effect";

// The source side is an optional key, so a missing array decodes too.
const nullishArrayOfNullishStringsSchema = Schema.optionalKey(
	Schema.NullishOr(Schema.Array(Schema.NullishOr(Schema.String))),
);
const arrayOfNonEmptyStringsSchema = Schema.Array(Schema.NonEmptyString);

/**
 * Decodes `(string | null | undefined)[] | null | undefined` into `string[]`,
 * dropping `null`, `undefined` and `""` items. A missing array becomes `[]`.
 */
export const arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings =
	nullishArrayOfNullishStringsSchema.pipe(
		Schema.decodeTo(arrayOfNonEmptyStringsSchema, {
			decode: SchemaGetter.transformOptional((input) =>
				Option.some(
					(Option.getOrUndefined(input) ?? []).filter(
						(item): item is string => item != null && item !== "",
					),
				),
			),
			encode: SchemaGetter.passthrough({ strict: false }),
		}),
	);
