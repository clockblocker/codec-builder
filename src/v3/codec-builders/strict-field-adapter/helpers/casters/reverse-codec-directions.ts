import type { z } from "zod/v3";

import type { SchemaCodec } from "../../../../core/types.js";

export function reverseCodecDirections<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: SchemaCodec<TInputSchema, TOutputSchema>) {
	return {
		fromInput: codec.fromOutput,
		fromOutput: codec.fromInput,
		inputSchema: codec.outputSchema,
		outputSchema: codec.inputSchema,
	} as const satisfies SchemaCodec<TOutputSchema, TInputSchema>;
}
