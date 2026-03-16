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
	TSchema extends z.ZodType<O, z.ZodTypeDef, any> = z.ZodType<
		O,
		z.ZodTypeDef,
		any
	>,
> = Prettify<
	CodecPair<I, O> & {
		outputSchema: TSchema;
	}
>;

export type NoOpCodec = {
	readonly __noOpCodec: true;
};

export type SchemaShapeOf<TSchema extends z.AnyZodObject> =
	TSchema extends z.ZodObject<infer TShape, any, any, any, any>
		? TShape
		: never;

export type AnyCodec = Codec<any, any, any>;
