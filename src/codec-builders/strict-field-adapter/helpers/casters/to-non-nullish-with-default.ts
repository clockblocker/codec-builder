import { z } from "zod/v4";

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

	return z.codec(codec.in, outputSchema, {
		decode: (input) =>
			(codec.decode(input as z.input<typeof codec>) ??
				resolveDefault()) as z.input<typeof outputSchema>,
		encode: (output) =>
			codec.encode(output as z.output<typeof codec>) as z.output<
				typeof codec.in
			>,
	});
}
