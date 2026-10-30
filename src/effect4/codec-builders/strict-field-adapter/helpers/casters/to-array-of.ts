import { Schema } from "effect";

/** An array of the codec. This is Effect's own `Schema.Array`. */
export function toArrayOf<TCodec extends Schema.Constraint>(
	itemCodec: TCodec,
): Schema.$Array<TCodec> {
	return Schema.Array(itemCodec);
}
