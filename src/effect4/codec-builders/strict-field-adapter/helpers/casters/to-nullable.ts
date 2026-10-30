import { Effect, Schema } from "effect";

/**
 * Encoded side `| null | undefined` (an optional key in a struct), Type side
 * `| null`: undefined and a missing key decode to null. Built from Effect's
 * `Schema.NullOr` and `Schema.withDecodingDefault`.
 */
export function toNullable<TCodec extends Schema.Constraint>(
	codec: TCodec,
): Schema.withDecodingDefault<Schema.NullOr<TCodec>> {
	return Schema.NullOr(codec).pipe(
		Schema.withDecodingDefault(Effect.succeed(null)),
	);
}
