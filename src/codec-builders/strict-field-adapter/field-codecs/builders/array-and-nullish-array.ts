import { z } from "zod";

import type { Codec } from "../../../../../core/types";

export function buildArrayAndNullishArrayCodec<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(itemCodec: Codec<TInputSchema, TOutputSchema>) {
	const inputSchema = z.array(itemCodec.inputSchema).nullish();
	const outputSchema = z.array(itemCodec.outputSchema);

	return {
		fromInput: input => (input ?? []).map(itemCodec.fromInput),
		fromOutput: output => output.map(itemCodec.fromOutput),
		inputSchema,
		outputSchema,
	} as const satisfies Codec<typeof inputSchema, typeof outputSchema>;
}
