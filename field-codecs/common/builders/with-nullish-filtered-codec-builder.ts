/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";

import type { Codec } from "../../../types";

export function withNullishFilteredCodecBuilder<
	O,
	I,
	TSchema extends z.ZodType<O, z.ZodTypeDef, any>,
>(codec: Codec<O, I, TSchema>) {
	const outputSchema = codec.outputSchema.nullish();

	return {
		fromInput: (input: I | null | undefined): O | undefined =>
			input == null ? undefined : codec.fromInput(input),
		fromOutput: (output: O | null | undefined): I | undefined =>
			output == null ? undefined : codec.fromOutput(output),
		outputSchema,
	} as const satisfies Codec<
		z.output<typeof outputSchema>,
		I | null | undefined,
		typeof outputSchema
	>;
}
