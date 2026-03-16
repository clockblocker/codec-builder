/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToUndefined } from "../../core/helpers/nullish-utils";

export function withNullishFilteredCodecBuilder<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: Codec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.inputSchema.nullish();
	const outputSchema = codec.outputSchema.nullish();

	return {
		fromInput: input => mapNullishToUndefined(input, codec.fromInput),
		fromOutput: output => mapNullishToUndefined(output, codec.fromOutput),
		inputSchema,
		outputSchema,
	} as const satisfies Codec<typeof inputSchema, typeof outputSchema>;
}
