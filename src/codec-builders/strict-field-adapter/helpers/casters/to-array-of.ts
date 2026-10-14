import { z } from "zod/v4";
import { runWrappedItems } from "./run-wrapped.js";

export function toArrayOf<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(itemCodec: z.ZodCodec<TInputSchema, TOutputSchema>) {
	return z.codec(z.array(itemCodec.in), z.array(itemCodec.out), {
		decode: (input, payload) =>
			runWrappedItems(itemCodec, "decode", input, payload) as Promise<
				z.input<TOutputSchema>[]
			>,
		encode: (output, payload) =>
			runWrappedItems(itemCodec, "encode", output, payload) as Promise<
				z.output<TInputSchema>[]
			>,
	});
}
