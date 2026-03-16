/** biome-ignore-all lint/suspicious/noExplicitAny: zod schema input generic is intentionally unconstrained */
import type { z } from "zod";

export type CodecPair<I, O> = {
	fromInput: (input: I) => O;
	fromOutput: (output: O) => I;
};

export function codec<I>() {
	return <O>(fromInput: (input: I) => O) =>
		(fromOutput: (output: O) => I): CodecPair<I, O> => ({
			fromInput,
			fromOutput,
		});
}

export function pipeCodecs<
	A,
	B,
	C,
	TSchema extends z.ZodType<C, z.ZodTypeDef, any>,
>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C> & { outputSchema: TSchema },
): CodecPair<A, C> & { outputSchema: TSchema };
export function pipeCodecs<A, B, C>(
	ab: CodecPair<A, B>,
	bc: CodecPair<B, C>,
): CodecPair<A, C>;
export function pipeCodecs<
	A,
	B,
	C,
	TSchema extends z.ZodType<C, z.ZodTypeDef, any>,
>(
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

export function withOutputSchema<
	I,
	O,
	TSchema extends z.ZodType<O, z.ZodTypeDef, any>,
>(codecPair: CodecPair<I, O>, outputSchema: TSchema) {
	return {
		...codecPair,
		outputSchema,
	};
}
