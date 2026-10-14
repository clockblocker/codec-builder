import { z } from "zod/v4";
import { forZod, then } from "../../../../core/maybe-async.js";
import { runWrapped } from "./run-wrapped.js";

/**
 * A default value, or a function that returns one. A function is called on
 * every decode that needs the default, so `() => new Date()` is "now" at
 * decode time and `() => []` is a fresh array each time. To default to a
 * function value, wrap it: `() => myFunction`.
 */
export type DefaultValue<T> = T | (() => T);

export function toNonNullishWithDefault<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(
	codec: z.ZodCodec<
		z.ZodOptional<z.ZodNullable<TInputSchema>>,
		z.ZodNullable<TOutputSchema>
	>,
	defaultValue: DefaultValue<z.output<TOutputSchema>>,
) {
	const outputSchema = codec.out.unwrap();
	const resolveDefault = (): z.output<TOutputSchema> =>
		typeof defaultValue === "function"
			? (defaultValue as () => z.output<TOutputSchema>)()
			: defaultValue;

	// codec.in is this codec's in, and outputSchema is codec.out unwrapped, so
	// only the wrapped codec's function runs here (see run-wrapped.ts).
	return z.codec(codec.in, outputSchema, {
		decode: (input, payload) =>
			forZod(
				then(
					runWrapped(codec, "decode", input, payload),
					(value) => value ?? resolveDefault(),
				),
			) as Promise<z.input<typeof outputSchema>>,
		encode: (output, payload) =>
			runWrapped(codec, "encode", output, payload) as Promise<
				z.output<typeof codec.in>
			>,
	});
}
