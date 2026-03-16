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
	O,
	I,
	TInputSchema extends z.ZodType<I, z.ZodTypeDef, any> = z.ZodType<
		I,
		z.ZodTypeDef,
		any
	>,
	TOutputSchema extends z.ZodType<O, z.ZodTypeDef, any> = z.ZodType<
		O,
		z.ZodTypeDef,
		any
	>,
> = Prettify<
	CodecPair<I, O> & {
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

export type AnyCodec = Codec<any, any, any, any>;
