/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";

import type { Codec } from "../../core/types";

export function withNullishFilteredCodecBuilder<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: Codec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.inputSchema.nullish();
	const outputSchema = codec.outputSchema.nullish();

	return {
		fromInput: (input) => input == null ? undefined : codec.fromInput(input),
		fromOutput: (output) => output == null ? undefined : codec.fromOutput(output),
		inputSchema,
		outputSchema,
	} as const satisfies Codec<typeof inputSchema, typeof outputSchema>;
}
