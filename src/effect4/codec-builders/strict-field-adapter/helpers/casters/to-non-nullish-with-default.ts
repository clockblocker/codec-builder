import { Schema, SchemaGetter } from "effect";
import type { DefaultValue } from "../../../../core/types.js";

/** A codec built by `toNullable`: its `to` side is `NullOr(inner)`. */
type NullableCodec = Schema.Top & {
	readonly to: { readonly members: readonly [Schema.Top, Schema.Null] };
};

type InnerOf<TCodec extends NullableCodec> = TCodec["to"]["members"][0];

/**
 * Replaces the null that a `toNullable` codec decodes (from null, undefined
 * or a missing key) with `defaultValue`. The Encoded side is unchanged and
 * the Type side is the inner codec's.
 */
export function toNonNullishWithDefault<TCodec extends NullableCodec>(
	codec: TCodec,
	defaultValue: DefaultValue<InnerOf<TCodec>["Type"]>,
): Schema.decodeTo<Schema.toType<InnerOf<TCodec>>, TCodec> {
	const resolveDefault = (): InnerOf<TCodec>["Type"] =>
		typeof defaultValue === "function"
			? (defaultValue as () => InnerOf<TCodec>["Type"])()
			: defaultValue;
	const inner = codec.to.members[0] as InnerOf<TCodec>;

	return codec.pipe(
		Schema.decodeTo(Schema.toType(inner), {
			decode: SchemaGetter.transform(
				(value: InnerOf<TCodec>["Type"] | null) =>
					value ?? resolveDefault(),
			),
			encode: SchemaGetter.passthrough({ strict: false }),
		}),
	) as never;
}
