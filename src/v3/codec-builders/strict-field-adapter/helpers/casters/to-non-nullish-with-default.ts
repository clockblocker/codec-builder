/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod/v3";
import type { SchemaCodec } from "../../../../core/types";

/**
 * A default value, or a function that creates one. A function is called on
 * every decode, so each result gets a fresh value. Use a function for objects,
 * arrays and dates so results don't share one instance. If the default itself
 * is a function, wrap it: `() => myFunction`.
 */
export type DefaultValue<T> = T | (() => T);

export function toNonNullishWithDefault<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(
	codec: SchemaCodec<
		z.ZodOptional<z.ZodNullable<TInputSchema>>,
		z.ZodNullable<TOutputSchema>
	>,
	defaultValue: DefaultValue<z.output<TOutputSchema>>,
) {
	const inputSchema = codec.inputSchema;
	const outputSchema = codec.outputSchema.unwrap();
	const getDefault =
		typeof defaultValue === "function"
			? (defaultValue as () => z.output<TOutputSchema>)
			: () => defaultValue;

	return {
		fromInput: (input) => codec.fromInput(input) ?? getDefault(),
		fromOutput: (output) => codec.fromOutput(output),
		inputSchema,
		outputSchema,
	} as const satisfies SchemaCodec<typeof inputSchema, typeof outputSchema>;
}
