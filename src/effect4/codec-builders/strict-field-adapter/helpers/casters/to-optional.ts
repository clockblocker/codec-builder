import { Schema } from "effect";

/**
 * Both sides `| undefined`, and an optional key in a struct. This is Effect's
 * own `Schema.optional`, kept for parity with the Zod helpers.
 */
export function toOptional<TCodec extends Schema.Constraint>(
	codec: TCodec,
): Schema.optional<TCodec> {
	return Schema.optional(codec);
}
