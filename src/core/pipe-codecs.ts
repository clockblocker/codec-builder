/* eslint-disable @typescript-eslint/no-explicit-any -- zod schema generics are intentionally unconstrained */
import type { z } from "zod";

import type { Codec, CodecPair } from "./types";

export function pipeCodecs<
	A,
	B,
	C,
	TInputSchema extends z.ZodType<A, z.ZodTypeDef, any>,
	TOutputSchema extends z.ZodType<C, z.ZodTypeDef, any>,
>(
	ab: Codec<B, A, TInputSchema, z.ZodType<B, z.ZodTypeDef, any>>,
	bc: Codec<C, B, z.ZodType<B, z.ZodTypeDef, any>, TOutputSchema>,
): Codec<C, A, TInputSchema, TOutputSchema>;
export function pipeCodecs<A, B, C>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C>,
): CodecPair<A, C>;
export function pipeCodecs<
	A,
	B,
	C,
	TInputSchema extends z.ZodType<A, z.ZodTypeDef, any>,
	TOutputSchema extends z.ZodType<C, z.ZodTypeDef, any>,
>(
	ab: CodecPair<A, B> & { inputSchema?: TInputSchema },
	bc: CodecPair<B, C> & { outputSchema?: TOutputSchema },
): CodecPair<A, C> & {
	inputSchema?: TInputSchema;
	outputSchema?: TOutputSchema;
} {
	const piped = {
		fromInput: (input: A) => bc.fromInput(ab.fromInput(input)),
		fromOutput: (output: C) => ab.fromOutput(bc.fromOutput(output)),
	};

	if ("inputSchema" in ab && "outputSchema" in bc) {
		return {
			...piped,
			inputSchema: ab.inputSchema,
			outputSchema: bc.outputSchema,
		};
	}

	return piped;
}
