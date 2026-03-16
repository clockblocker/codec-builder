/* eslint-disable @typescript-eslint/no-explicit-any -- zod schema input generic is intentionally unconstrained */
import type { z } from "zod";

import type { CodecPair } from "./types";

export function pipeCodecs<A, B, C, TSchema extends z.ZodType<C, z.ZodTypeDef, any>>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C> & { outputSchema: TSchema },
): CodecPair<A, C> & { outputSchema: TSchema };
export function pipeCodecs<A, B, C>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C>,
): CodecPair<A, C>;
export function pipeCodecs<A, B, C, TSchema extends z.ZodType<C, z.ZodTypeDef, any>>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C> & { outputSchema?: TSchema },
): CodecPair<A, C> & { outputSchema?: TSchema } {
	const piped = {
		fromInput: (input: A) => bc.fromInput(ab.fromInput(input)),
		fromOutput: (output: C) => ab.fromOutput(bc.fromOutput(output)),
	};

	if ("outputSchema" in bc) {
		return {
			...piped,
			outputSchema: bc.outputSchema,
		};
	}

	return piped;
}
