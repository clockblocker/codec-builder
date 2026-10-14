import { z } from "zod/v4";
import { runWrapped } from "./run-wrapped.js";

export function toOptional<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: z.ZodCodec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.in.optional();
	const outputSchema = codec.out.optional();
	return z.codec<typeof inputSchema, typeof outputSchema>(
		inputSchema,
		outputSchema,
		{
			decode: (input, payload) =>
				input === undefined
					? undefined
					: (runWrapped(codec, "decode", input, payload) as Promise<
							z.input<TOutputSchema>
						>),
			encode: (output, payload) =>
				output === undefined
					? undefined
					: (runWrapped(codec, "encode", output, payload) as Promise<
							z.output<TInputSchema>
						>),
		},
	);
}
