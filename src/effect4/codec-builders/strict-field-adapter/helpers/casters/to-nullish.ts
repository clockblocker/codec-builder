import { Schema } from "effect";

/**
 * Both sides `| null | undefined`, and an optional key in a struct: null,
 * undefined and a missing key are kept as they are.
 */
export function toNullish<TCodec extends Schema.Constraint>(
	codec: TCodec,
): Schema.optionalKey<Schema.NullishOr<TCodec>> {
	return Schema.optionalKey(Schema.NullishOr(codec));
}
