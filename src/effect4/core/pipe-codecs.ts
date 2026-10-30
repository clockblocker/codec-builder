import { Schema } from "effect";

/**
 * Chains two codecs: `left` decodes A into B, then `right` decodes B into C.
 * This is Effect's own `left.pipe(Schema.decodeTo(right))`, so `from` is
 * `left` and `to` is `right`.
 */
export function pipeCodecs<
	TLeft extends Schema.Top,
	TRight extends Schema.Codec<unknown, TLeft["Type"], unknown, unknown>,
>(left: TLeft, right: TRight): Schema.compose<TRight, TLeft> {
	return left.pipe(Schema.decodeTo(right));
}
