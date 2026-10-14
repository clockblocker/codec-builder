/* eslint-disable @typescript-eslint/no-explicit-any -- Zod internals typing */
/** biome-ignore-all lint/suspicious/noExplicitAny: Zod internals typing */

// The only module that touches Zod internals (`_zod`, `_def`). Everything
// here is pinned by tests/zod-internals.test.ts, and
// tests/zod-internals-boundary.test.ts keeps `_zod` out of other modules.
// The shapes used are the same in Zod 4.4 through 4.6.

import type { z } from "zod/v4";

// -- Types --

/** A schema's `def.type` ("string", "pipe", "optional", ...). */
export type DefTypeOf<TSchema extends z.core.$ZodType> =
	TSchema["_zod"]["def"]["type"];

/** A schema whose output side is optional, the way `z.object` reads it. */
export type OptionalOutputSchema = { _zod: { optout: "optional" } };

/** Whether `z.object` treats the schema's key as optional in the output. */
export type IsOptionalOutput<TSchema extends z.core.$ZodType> =
	TSchema["_zod"]["optout"] extends "optional" ? true : false;

/** The unknown-key policy (`$strip`, `$strict`, `$loose`, `$catchall<T>`). */
export type ObjectConfigOf<TSchema> = TSchema extends {
	_zod: { config: infer TConfig extends z.core.$ZodObjectConfig };
}
	? TConfig
	: z.core.$strip;

/** The output type of a codec's `in` schema. */
export type CodecInOutputOf<TCodec> = TCodec extends {
	_zod: { def: { in: { _zod: { output: infer TOutput } } } };
}
	? TOutput
	: never;

// -- Reading schemas --

type WithInternals = {
	_zod?: { def?: Record<string, unknown> };
	_def?: { type?: unknown };
};

function defOf(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null
		? (value as WithInternals)._zod?.def
		: undefined;
}

/**
 * Every Zod 4 schema has decode/encode methods and every pipe has `in` and
 * `out`, so only the def tells a codec apart: z.codec (and z.stringbool,
 * z.invertCodec) put both transforms on a pipe def.
 */
export function isCodec(value: unknown): value is z.ZodCodec {
	const def = defOf(value);
	return (
		def?.type === "pipe" &&
		typeof def.transform === "function" &&
		typeof def.reverseTransform === "function"
	);
}

/** A Zod schema from any copy of Zod (structural, not instanceof). */
export function isZodSchema(value: unknown): value is z.ZodTypeAny {
	return (
		typeof value === "object" &&
		value !== null &&
		"_def" in value &&
		"safeParse" in value &&
		typeof (value as { safeParse?: unknown }).safeParse === "function"
	);
}

/** The schema's `def.type`, read from `_def` so look-alike objects work. */
export function schemaType(schema: unknown): string | undefined {
	if (typeof schema !== "object" || schema === null) return undefined;
	const type = (schema as WithInternals)._def?.type;
	return typeof type === "string" ? type : undefined;
}

/** A pipe's (or codec's) `out` schema. */
export function pipeOut(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.out as z.ZodTypeAny | undefined;
}

/** The inner schema of a default, prefault or catch. */
export function innerTypeOf(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.innerType as z.ZodTypeAny | undefined;
}

/** An object's catchall: never for strict, unknown for loose, none for strip. */
export function objectCatchall(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.catchall as z.ZodTypeAny | undefined;
}

// -- Codec transforms --

export type CodecTransform = (
	value: unknown,
	payload: z.core.ParsePayload<unknown>,
) => unknown;

/** A codec's decode and encode functions, without its schemas. */
export function codecTransforms(codec: z.core.$ZodType): {
	transform: CodecTransform;
	reverseTransform: CodecTransform;
} {
	const def = defOf(codec);
	return {
		transform: def?.transform as CodecTransform,
		reverseTransform: def?.reverseTransform as CodecTransform,
	};
}
