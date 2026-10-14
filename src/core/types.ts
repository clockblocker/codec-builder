/* eslint-disable @typescript-eslint/no-explicit-any -- Library generic shape */
/** biome-ignore-all lint/suspicious/noExplicitAny: Library generic shape */
import type { z } from "zod/v4";

// Prefer naming codecs like: OutputAndInput for readability.
export type CodecPair<I, O> = {
	decode: (input: I) => O;
	encode: (output: O) => I;
};

/**
 * A `CodecPair` with async variants. `decodeAsync`/`encodeAsync` also run
 * async field codecs; the sync methods throw Zod's `$ZodAsyncError` there.
 */
export interface AsyncCodecPair<I, O> extends CodecPair<I, O> {
	decodeAsync: (input: I) => Promise<O>;
	encodeAsync: (output: O) => Promise<I>;
}

export type NoOpCodec = {
	readonly __noOpCodec: true;
};

export type SchemaShapeOf<TSchema extends z.ZodObject> =
	TSchema extends z.ZodObject<infer TShape, any> ? TShape : never;

/**
 * A Zod 4 codec that decodes `TInput` into `TOutput`. Every `fieldCodec` entry
 * and any `z.codec(...)` with matching types is assignable to it.
 */
export type Codec<TOutput = unknown, TInput = unknown> = z.ZodCodec<
	z.ZodType<unknown, TInput>,
	z.ZodType<TOutput, unknown>
>;

/** Flattens intersections/aliases so hovers show the resolved object. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};
