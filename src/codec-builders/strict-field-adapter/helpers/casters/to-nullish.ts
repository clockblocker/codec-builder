import { z } from "zod/v4";
import { runWrapped } from "./run-wrapped.js";

export function toNullish<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: z.ZodCodec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.in.nullish();
	const outputSchema = codec.out.nullish();
	return z.codec<typeof inputSchema, typeof outputSchema>(
		inputSchema,
		outputSchema,
		{
			decode: (input, payload) =>
				input === null || input === undefined
					? (input as null | undefined)
					: (runWrapped(codec, "decode", input, payload) as Promise<
							z.input<TOutputSchema>
						>),
			encode: (output, payload) =>
				output === null || output === undefined
					? (output as null | undefined)
					: (runWrapped(codec, "encode", output, payload) as Promise<
							z.output<TInputSchema>
						>),
		},
	);
}
