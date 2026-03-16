/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";
import { mapNullishToNullable } from "../../../core/helpers/nullish-utils";
import type { Codec } from "../../../core/types";

export function buildWithNullishFiltered<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: Codec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.inputSchema.nullish();
	const outputSchema = codec.outputSchema.nullish();

	return {
		fromInput: (input) => mapNullishToNullable(input, codec.fromInput),
		fromOutput: (output) => mapNullishToNullable(output, codec.fromOutput),
		inputSchema,
		outputSchema,
	} as const satisfies Codec<typeof inputSchema, typeof outputSchema>;
}
