/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";

import type { Codec } from "../../core/types";

export function withNullishFilteredCodecBuilder<
	O,
	I,
	TInputSchema extends z.ZodType<I, z.ZodTypeDef, any>,
	TOutputSchema extends z.ZodType<O, z.ZodTypeDef, any>,
>(codec: Codec<O, I, TInputSchema, TOutputSchema>) {
	const inputSchema = codec.inputSchema.nullish();
	const outputSchema = codec.outputSchema.nullish();

	return {
		fromInput: (input: I | null | undefined): O | undefined =>
			input == null ? undefined : codec.fromInput(input),
		fromOutput: (output: O | null | undefined): I | undefined =>
			output == null ? undefined : codec.fromOutput(output),
		inputSchema,
		outputSchema,
	} as const satisfies Codec<
		z.output<typeof outputSchema>,
		z.output<typeof inputSchema>,
		typeof inputSchema,
		typeof outputSchema
	>;
}
