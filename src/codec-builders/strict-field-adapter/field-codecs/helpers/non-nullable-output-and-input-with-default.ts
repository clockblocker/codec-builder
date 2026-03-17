/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod";
import type { SchemaCodec } from "../../../../core/types";

export function buildNonNullableOutputAndInputWithDefaultCodec<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(
	codec: SchemaCodec<
		z.ZodOptional<z.ZodNullable<TInputSchema>>,
		z.ZodNullable<TOutputSchema>
	>,
	defaultValue: z.output<TInputSchema>,
) {
	const inputSchema = codec.inputSchema.unwrap().unwrap();
	const outputSchema = codec.outputSchema.unwrap();

	return {
		fromInput: (input) => {
			const output = codec.fromInput(input);

			if (output == null) {
				throw new Error(
					"Expected a non-nullable output for a non-nullish input",
				);
			}

			return output;
		},
		fromOutput: (output) => codec.fromOutput(output) ?? defaultValue,
		inputSchema,
		outputSchema,
	} as const satisfies SchemaCodec<typeof inputSchema, typeof outputSchema>;
}
