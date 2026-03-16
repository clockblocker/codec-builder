/* eslint-disable @typescript-eslint/no-explicit-any -- Library generic shape */
import type { z } from "zod";

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

// Prefer naming codecs like: OutputAndInput for readability.
export type CodecPair<I, O> = {
	fromInput: (input: I) => O;
	fromOutput: (output: O) => I;
};

// Prefer naming codecs like: OutputAndInput for consistent readability.
export type Codec<
	TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = Prettify<
	CodecPair<z.output<TInputSchema>, z.output<TOutputSchema>> & {
		inputSchema: TInputSchema;
		outputSchema: TOutputSchema;
	}
>;

export type NoOpCodec = {
	readonly __noOpCodec: true;
};

export type SchemaShapeOf<TSchema extends z.AnyZodObject> =
	TSchema extends z.ZodObject<infer TShape, any, any, any, any>
		? TShape
		: never;

export type AnyCodec = Codec<z.ZodTypeAny, z.ZodTypeAny>;
