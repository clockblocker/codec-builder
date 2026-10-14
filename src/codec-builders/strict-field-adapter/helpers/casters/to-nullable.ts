import { z } from "zod/v4";
import { runWrapped } from "./run-wrapped.js";

export function toNullable<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: z.ZodCodec<TInputSchema, TOutputSchema>) {
	const inputSchema = codec.in.nullish();
	const outputSchema = codec.out.nullable();
	return z.codec<typeof inputSchema, typeof outputSchema>(
		inputSchema,
		outputSchema,
		{
			decode: (input, payload) =>
				input == null
					? null
					: (runWrapped(codec, "decode", input, payload) as Promise<
							z.input<TOutputSchema>
						>),
			encode: (output, payload) =>
				output == null
					? null
					: (runWrapped(codec, "encode", output, payload) as Promise<
							z.output<TInputSchema>
						>),
		},
	);
}
